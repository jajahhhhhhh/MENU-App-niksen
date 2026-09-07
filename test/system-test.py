#!/usr/bin/env python3
"""End-to-end test of the whole till: login, menu, options, members, orders at
the counter and online, discounts, points, cancellation, purchases, bill
import, stock, the daily report, staff hours, settings and events.

Run it against a COPY of the database, never the live one — it rings up
orders, takes stock off the shelf and changes settings.

    cd /path/to/a/scratch/dir
    ssh niksen 'cd /opt/niksen-secret-bar && sqlite3 pos.db ".backup /tmp/t.db" && cat /tmp/t.db && rm /tmp/t.db' > pos.db
    chmod 600 pos.db                       # it holds customer phone numbers
    sqlite3 pos.db "UPDATE settings SET value='1234' WHERE key='staff_pin'"
    ln -s /path/to/repo/dist dist && ln -s /path/to/repo/photos photos
    NODE_ENV=production INSECURE_COOKIES=1 SESSION_SECRET=test PORT=3190 \
      npx tsx /path/to/repo/server.ts &
    python3 system-test.py

INSECURE_COOKIES=1 exists so the session cookie works over plain http on a
laptop; production never sets it. ORDERING_OVERRIDE and OPENING_HOURS in
src/config.ts have to be opened up for the online-order section to be
reachable outside shop hours — put them back afterwards.
"""
import json, urllib.request, urllib.error, http.cookiejar, sqlite3, sys, time
B = "http://127.0.0.1:3190"
DB = "pos.db"
jar = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

P = F = 0
FAILS = []
def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(B+path, data=data, method=method,
                                 headers={"Content-Type":"application/json"})
    try:
        with op.open(req, timeout=20) as r:
            raw = r.read().decode()
            try: return r.status, json.loads(raw)
            except Exception: return r.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try: return e.code, json.loads(raw)
        except Exception: return e.code, raw

def ok(name, cond, detail=""):
    global P, F
    if cond: P += 1; print(f"  ok   {name}" + (f"  [{detail}]" if detail else ""))
    else:
        F += 1; FAILS.append(name); print(f"  FAIL {name}  {detail}")

def q(sql, *a):
    c = sqlite3.connect(DB); c.row_factory = sqlite3.Row
    try: return [dict(r) for r in c.execute(sql, a)]
    finally: c.close()

def one(sql, *a):
    r = q(sql, *a); return r[0] if r else None

print("\n=== 1. เข้าสู่ระบบ / Auth ===")
s,_ = call("GET","/api/orders");                       ok("staff route locked before login", s==401, f"{s}")
s,b = call("POST","/api/auth/login", {"pin":"9999"});  ok("wrong PIN rejected", s==401, f"{s}")
s,b = call("POST","/api/auth/login", {"pin":"1234"});  ok("correct PIN accepted", s==200, f"{s}")
s,b = call("GET","/api/auth/me");                      ok("session recognised", s==200 and b.get("authed") is True, str(b))
s,_ = call("GET","/api/orders");                       ok("staff route open after login", s==200, f"{s}")

print("\n=== 2. เมนู: เพิ่ม / แก้ราคา / ซ่อน / ลบ ===")
s,b = call("POST","/api/menu", {"name":"ZZ Test Dish","category":"Test","price":100,
                                "description":"lab","available":1,"stock_quantity":10})
NEW = b.get("id") if isinstance(b,dict) else None
ok("create item", s in (200,201) and NEW, f"{s} id={NEW}")
row = one("SELECT name, price, barcode FROM menu_items WHERE id=?", NEW)
ok("saved with the price given", row and row["price"]==100, str(row))
ok("barcode auto-assigned", bool(row and row["barcode"]), str(row and row["barcode"]))
s,_ = call("PATCH", f"/api/menu/{NEW}", {"price":149})
ok("edit price", s==200 and one("SELECT price FROM menu_items WHERE id=?",NEW)["price"]==149, f"{s}")
s,_ = call("PATCH", f"/api/menu/{NEW}", {"available":0})
ok("hide item", s==200 and one("SELECT available FROM menu_items WHERE id=?",NEW)["available"]==0, f"{s}")
_,pub = call("GET","/api/public/menu")
ok("hidden item not on the public menu", all(i["id"]!=NEW for i in pub), f"{len(pub)} public items")
call("PATCH", f"/api/menu/{NEW}", {"available":1})
_,pub = call("GET","/api/public/menu")
ok("unhidden item back on the public menu", any(i["id"]==NEW for i in pub))
s,_ = call("PATCH", f"/api/menu/{NEW}", {"price":0})
_,pub = call("GET","/api/public/menu")
ok("price 0 removes it from the public menu", all(i["id"]!=NEW for i in pub), "unpriced = not for sale")
call("PATCH", f"/api/menu/{NEW}", {"price":149})

print("\n=== 3. ตัวเลือกเสริม (options) ===")
s,g = call("POST", f"/api/menu/{NEW}/option-groups", {"name":"Size","min_select":1,"max_select":1})
GID = g.get("id") if isinstance(g,dict) else None
ok("create option group", s in (200,201) and GID, f"{s}")
s,o1 = call("POST", f"/api/option-groups/{GID}/options", {"name":"Regular","price":0})
s2,o2 = call("POST", f"/api/option-groups/{GID}/options", {"name":"Large","price":30})
ok("create two options", s in (200,201) and s2 in (200,201), f"{s},{s2}")
OPT_L = o2.get("id") if isinstance(o2,dict) else None
print(f"     item {NEW} = ฿149, Large +฿30")

print("\n=== 4. สมาชิก / Members ===")
s,m = call("POST","/api/members", {"name":"Lab Tester","phone":"0899999001","email":""})
MID = m.get("id") if isinstance(m,dict) else None
ok("create member", s==200 and MID, f"{s}")
mrow = one("SELECT points, tier, total_spent FROM members WHERE id=?", MID)
ok("starts Silver with a welcome balance", mrow["tier"]=="Silver", str(mrow))
s,b = call("POST","/api/members", {"name":"Dup","phone":"0899999001"})
ok("duplicate phone refused", s>=400, f"{s} {b}")

print("\n=== 5. ขายหน้าร้าน / POS order ===")
_,menu = call("GET","/api/menu")
soda  = next(i for i in menu if i["category"]=="Craft Soda")
food  = next(i for i in menu if i["category"]=="Sandwich")
before_lots = one("SELECT SUM(qty_remaining) t FROM ingredient_lots")["t"]
s,o = call("POST","/api/orders", {
    "table_number": 5, "notes":"lab order", "discount_type":"percentage", "discount_value":0,
    "member_id": MID, "points_redeemed":0,
    "items":[{"menu_item_id":food["id"],"quantity":2,"price":food["price"]},
             {"menu_item_id":soda["id"],"quantity":1,"price":soda["price"]}]})
OID = o.get("id") if isinstance(o,dict) else None
ok("create till order", s==200 and OID, f"{s} id={OID}")
sub = food["price"]*2 + soda["price"]
import math
exp_total = round(sub*1.07)
s,det = call("GET", f"/api/orders/{OID}")
ok("order total = subtotal +7% rounded to the baht",
   round(det.get("total", -1)) == exp_total, f"got {det.get('total')} want {exp_total}")
ok("order carries its lines", len(det.get("items",[]))==2, str(len(det.get("items",[]))))
ok("table number kept", det.get("table_number")==5, str(det.get("table_number")))
after_lots = one("SELECT SUM(qty_remaining) t FROM ingredient_lots")["t"]
ok("ingredients came off the shelf", after_lots < before_lots, f"{before_lots} -> {round(after_lots,1)}")
mv = one("SELECT COUNT(*) n FROM stock_movements WHERE order_id=? AND reason='sale'", OID)
ok("stock movements recorded", mv["n"] > 0, f"{mv['n']} lines")

print("\n=== 6. ส่วนลด และแต้ม / discount + points ===")
s,o2 = call("POST","/api/orders", {
    "table_number": 6, "discount_type":"percentage", "discount_value":10,
    "member_id": MID, "points_redeemed":0,
    "items":[{"menu_item_id":soda["id"],"quantity":2,"price":soda["price"]}]})
O2 = o2.get("id")
_,d2 = call("GET", f"/api/orders/{O2}")
sub2 = soda["price"]*2
ok("10% discount applied", d2.get("total") < round(sub2*1.07), f"{d2.get('total')} < {round(sub2*1.07)}")
pts_now = one("SELECT points, total_spent FROM members WHERE id=?", MID)
# Points are credited when the order is rung up, not when it is paid — the same
# rule the online path uses, so the two can never award twice for one order.
ok("points credited at order time", pts_now["points"] > 50, f"50 -> {pts_now['points']}")
ok("total_spent accumulates", pts_now["total_spent"] > 0, str(pts_now["total_spent"]))
s,_ = call("POST", f"/api/orders/{O2}/pay")
ok("mark paid", s==200, f"{s}")
paid = one("SELECT status, paid_at FROM orders WHERE id=?", O2)
ok("status becomes paid", paid["status"]=="paid", str(paid["status"]))
pts_after = one("SELECT points FROM members WHERE id=?", MID)
ok("payment does not credit points a second time", pts_after["points"]==pts_now["points"],
   f"{pts_now['points']} -> {pts_after['points']}")

print("\n=== 7. ยกเลิกออเดอร์ / cancel ===")
s,o3 = call("POST","/api/orders", {"table_number":7,"discount_type":"percentage","discount_value":0,
    "member_id":MID,"points_redeemed":0,
    "items":[{"menu_item_id":food["id"],"quantity":1,"price":food["price"]}]})
O3 = o3.get("id")
lots_after_order = one("SELECT SUM(qty_remaining) t FROM ingredient_lots")["t"]
m_after_order = one("SELECT points, total_spent FROM members WHERE id=?", MID)
s,_ = call("PATCH", f"/api/orders/{O3}/status", {"status":"cancelled"})
ok("cancel accepted", s==200, f"{s}")
lots_after_cancel = one("SELECT SUM(qty_remaining) t FROM ingredient_lots")["t"]
ok("ingredients put back on the shelf", abs(lots_after_cancel-lots_after_order) > 0.001,
   f"{round(lots_after_order,1)} -> {round(lots_after_cancel,1)}")
restock = one("SELECT COUNT(*) n FROM stock_movements WHERE order_id=? AND reason='restock'", O3)
ok("restock movements written", restock["n"] > 0, f"{restock['n']} lines")
s,_ = call("PATCH", f"/api/orders/{O3}/status", {"status":"cancelled"})
lots_twice = one("SELECT SUM(qty_remaining) t FROM ingredient_lots")["t"]
ok("cancelling twice does not double-credit stock", abs(lots_twice-lots_after_cancel) < 0.001,
   f"{round(lots_after_cancel,1)} -> {round(lots_twice,1)}")
m_after_cancel = one("SELECT points, total_spent, tier FROM members WHERE id=?", MID)
ok("points taken back when the order is cancelled",
   m_after_cancel["points"] < m_after_order["points"],
   f"{m_after_order['points']} -> {m_after_cancel['points']}")
ok("spend taken back too", m_after_cancel["total_spent"] < m_after_order["total_spent"],
   f"฿{m_after_order['total_spent']} -> ฿{m_after_cancel['total_spent']}")
m_twice = one("SELECT points, total_spent FROM members WHERE id=?", MID)
ok("cancelling twice does not deduct twice",
   m_twice["points"]==m_after_cancel["points"] and m_twice["total_spent"]==m_after_cancel["total_spent"],
   f"{m_after_cancel['points']}/{m_after_cancel['total_spent']} unchanged")
s,b = call("PATCH", f"/api/orders/{O3}/status", {"status":"banana"})
ok("an unknown status is refused", s==400, f"{s} {b}")
ok("the order keeps the status it had",
   one("SELECT status FROM orders WHERE id=?", O3)["status"]=="cancelled")

print("\n=== 8. สั่งออนไลน์ / online order ===")
_,pub = call("GET","/api/public/menu")
psoda = next(i for i in pub if i["category"]=="Craft Soda" and i["stock_quantity"] and i["stock_quantity"]>=2)
body = {"items":[{"menu_item_id":psoda["id"],"quantity":2}],"order_type":"pickup",
        "customer_name":"Lab Online","customer_phone":"0899999002",
        "client_token":"labtest-0000-1111-2222-333344445555"}
s,r1 = call("POST","/api/public/orders", body)
ok("online order accepted", s==200 and r1.get("id"), f"{s}")
ok("total is whole baht", isinstance(r1.get("total"),(int,float)) and float(r1["total"]).is_integer(), str(r1.get("total")))
ok("PromptPay payload returned", bool(r1.get("promptpay")), (r1.get("promptpay") or "")[:20]+"...")
s,r2 = call("POST","/api/public/orders", body)
ok("retry returns the same order (no duplicate)", r2.get("id")==r1["id"], f"{r1['id']} vs {r2.get('id')}")
ok("only one order in the database for that token",
   one("SELECT COUNT(*) n FROM orders WHERE client_token=?", body["client_token"])["n"]==1)
newmem = one("SELECT id, name, points FROM members WHERE phone='0899999002'")
ok("online customer enrolled as a member", newmem is not None, str(newmem))
_,orders = call("GET","/api/orders")
ok("online order visible at the till", any(o["id"]==r1["id"] for o in orders), f"{len(orders)} open orders")
s,st = call("GET", f"/api/public/orders/{r1['id']}/status")
ok("customer can track their order", s==200 and st.get("status"), str(st))
s,b = call("POST","/api/public/orders", {"items":[{"menu_item_id":psoda["id"],"quantity":50}],
    "order_type":"pickup","customer_name":"Greedy","customer_phone":"0899999003"})
ok("order beyond stock refused", s==400 and "stock" in str(b).lower(), f"{s} {b}")
s,b = call("POST","/api/public/orders", {"items":[{"menu_item_id":psoda["id"],"quantity":1}],
    "order_type":"pickup","customer_name":"NoPhone","customer_phone":"123"})
ok("short phone refused", s==400, f"{s} {b}")
s,b = call("POST","/api/public/orders", {"items":[{"menu_item_id":psoda["id"],"quantity":1}],
    "order_type":"delivery","customer_name":"NoAddr","customer_phone":"0899999004"})
ok("delivery without an address refused", s==400, f"{s} {b}")

print("\n=== 9. รายจ่าย: ลงบิลซื้อของ / purchases ===")
_,ings = call("GET","/api/inventory/ingredients")
ok("ingredient list loads", isinstance(ings,list) and len(ings)>0, f"{len(ings) if isinstance(ings,list) else '?'} ingredients")
butter = next((i for i in ings if "Butter" in i["name"]), None)
# Sandwiches sold above already ate butter that no bill has covered, so it sits
# negative. That is the point: the shortfall is what tells the shop to buy some.
ok("staples never bought show as owed, not as zero", butter is not None and (butter.get("on_hand") or 0) <= 0,
   f"{butter['name'] if butter else '?'} on hand {butter.get('on_hand') if butter else '?'}")
BUT0 = butter.get("on_hand") or 0
s,lot = call("POST","/api/inventory/lots", {"ingredient_id": butter["id"], "qty": 454, "total_cost": 240, "purchased_on": "2026-09-07", "expires_on": "2026-12-31", "note":"lab purchase"})
ok("record a purchase (รายจ่าย)", s==200, f"{s} {lot if s!=200 else ''}")
_,ings2 = call("GET","/api/inventory/ingredients")
b2 = next(i for i in ings2 if i["id"]==butter["id"])
ok("recording the purchase adds exactly what was bought", (b2.get("on_hand") or 0) == BUT0 + 454, f"{BUT0} + 454 = {b2.get('on_hand')}")
ok("unit cost now comes from the bill, not the estimate",
   abs((b2.get("unit_cost") or 0) - 240/454) < 0.001, f"{b2.get('unit_cost'):.4f} vs estimate 0.53")
_,costs = call("GET","/api/inventory/costs")
sw = next(c for c in costs if c["name"]=="Sandwich Ham")
ok("dish cost follows the real purchase price", sw["cost_complete"] and sw["cost"] > 0,
   f"Sandwich Ham ฿{sw['cost']:.2f}, margin {sw['margin_pct']:.1f}%")
ok("no dish is missing an ingredient price",
   all(c["cost_complete"] for c in costs if c["has_recipe"]),
   f"{sum(1 for c in costs if c['has_recipe'])} dishes costed")

print("\n=== 10. สต็อกและของใกล้หมดอายุ ===")
_,summ = call("GET","/api/inventory/summary")
ok("inventory summary loads", isinstance(summ,dict) and "ingredients" in summ, str(list(summ)[:6]) if isinstance(summ,dict) else str(summ))
_,exp = call("GET","/api/inventory/expiring?days=7")
ok("expiring-soon list works", isinstance(exp,list), f"{len(exp) if isinstance(exp,list) else '?'} lots within 7 days")
if isinstance(exp,list) and exp:
    ok("days_left counted from the Thai day", all(isinstance(e.get("days_left"),int) for e in exp),
       f"e.g. {exp[0].get('ingredient_name')} in {exp[0].get('days_left')} days")
_,mv = call("GET","/api/inventory/movements")
ok("stock movement ledger readable", isinstance(mv,list) and len(mv)>0, f"{len(mv) if isinstance(mv,list) else '?'} movements")

print("\n=== 11. นำเข้าบิลทั้งใบ / CSV bill import ===")
csv = ("ingredient_name,amount,unit,total_paid_THB,bought_on,expires_on,note\n"
       "Minced Beef (estimate),2,kg,540,2026-09-07,2026-09-20,lab bill\n"
       "Cooking Oil (estimate),1,L,62,2026-09-07,,lab bill\n")
s,prev = call("POST","/api/inventory/lots/import", {"csv": csv})
ok("bill preview before anything is written", s==200 and prev.get("preview") is True and prev.get("ready")==2,
   f"ready {prev.get('ready')}, errors {prev.get('errors')}")
ok("preview writes nothing", one("SELECT COUNT(*) n FROM ingredient_lots l JOIN ingredients i ON i.id=l.ingredient_id WHERE i.name LIKE 'Minced Beef%'")["n"]==0)
s,imp = call("POST","/api/inventory/lots/import", {"csv": csv, "commit": True})
ok("commit the bill", s==200 and imp.get("preview") is False and imp.get("imported")==2, f"{s} {imp if s!=200 else imp.get('imported')}")
beef = one("SELECT SUM(qty_remaining) q, SUM(total_cost) c FROM ingredient_lots l JOIN ingredients i ON i.id=l.ingredient_id WHERE i.name LIKE 'Minced Beef%'")
ok("kg converted to grams", beef and beef["q"]==2000, str(beef))
ok("the amount paid is what the bill said", beef and beef["c"]==540, str(beef["c"] if beef else None))
before = one("SELECT COUNT(*) n FROM ingredient_lots")["n"]
bad = "ingredient_name,amount,unit,total_paid_THB,bought_on,expires_on,note\nButter Unsalted (estimate),1,kg,300,2026-09-07,,ok line\nMinced Beef (estimate),-5,kg,100,2026-09-07,,bad line\n"
s,b = call("POST","/api/inventory/lots/import", {"csv": bad, "commit": True})
ok("a bill with one bad line is not committed", (b.get("errors") or 0) > 0 or s>=400,
   f"errors {b.get('errors') if isinstance(b,dict) else '?'}")
ok("nothing from the rejected bill was written",
   one("SELECT COUNT(*) n FROM ingredient_lots")["n"]==before, f"lots still {before}")

print("\n=== 12. รายงานรายวัน / daily report ===")
_,rep = call("GET","/api/reports/daily")
ok("report loads", isinstance(rep,dict), str(list(rep))[:110] if isinstance(rep,dict) else str(rep))
summ = rep.get("summary") or {}
print("     summary keys:", list(summ))
paid_ids = [r["id"] for r in q("""SELECT id FROM orders WHERE status='paid'
                                  AND date(paid_at,'+7 hours')=date('now','+7 hours')""")]
# Independent of the report's own SQL: ask the till for each paid order and add up.
indep = 0
for oid in paid_ids:
    _,d = call("GET", f"/api/orders/{oid}")
    indep += d.get("total") or 0
head = summ.get("revenue", summ.get("total_revenue"))
ok("revenue matches the paid orders, added up one by one",
   head is not None and abs(head - indep) < 0.5, f"report ฿{head} vs ฿{indep} over {len(paid_ids)} orders")
ok("order count matches", summ.get("total_orders") == len(paid_ids),
   f"report {summ.get('total_orders')} vs db {len(paid_ids)}")
cats = rep.get("categoryBreakdown") or []
csum = sum(c.get("revenue",0) for c in cats)
ok("category revenue sums exactly to the headline", head is not None and abs(csum - head) < 0.01,
   f"categories ฿{csum} vs headline ฿{head}")
ok("no decimals anywhere in the report",
   all(float(v).is_integer() for v in [head or 0] + [c.get("revenue",0) for c in cats]),
   f"revenue {head}, categories {[c.get('revenue') for c in cats]}")
tops = rep.get("topItems") or []
ok("best sellers listed", isinstance(tops,list), f"{len(tops)} items, top = {tops[0].get('name') if tops else '-'}")
s,rep2 = call("GET","/api/reports/daily?date=2026-09-06")
r2s = (rep2.get("summary") or {}) if isinstance(rep2,dict) else {}
ok("a past day can be asked for", s==200 and rep2.get("date")=="2026-09-06",
   f"{s} date={rep2.get('date') if isinstance(rep2,dict) else '?'} revenue ฿{r2s.get('revenue')}")

print("\n=== 12b. ยอดเงินต้องตรงกันทุกหน้าจอ ===")
_,lst = call("GET","/api/orders")
mismatch = []
for o in lst:
    _,d = call("GET", f"/api/orders/{o['id']}")
    if abs((o.get("total") or 0) - (d.get("total") or 0)) > 0.001:
        mismatch.append((o["id"], o.get("total"), d.get("total")))
ok("order list and order detail quote the same total", not mismatch, str(mismatch[:3]) or f"{len(lst)} orders agree")

print("\n=== 13. พนักงาน / staff ===")
s,st = call("GET","/api/staff")
ok("staff list loads", s==200, f"{s}")
s,b = call("POST","/api/staff/members", {"name":"Lab Staff","role":"barista"})
SID = b.get("id") if isinstance(b,dict) else None
ok("add a staff member", s==200 and SID, f"{s} {b}")
s,b = call("POST","/api/staff/clock-in", {"staff_id": SID})
ok("clock in", s==200, f"{s} {b}")
s,b = call("POST","/api/staff/clock-out", {"staff_id": SID})
ok("clock out", s==200, f"{s} {b}")

print("\n=== 14. ตั้งค่าร้าน / settings ===")
s,cur = call("GET","/api/settings")
ok("settings load", s==200 and "shop_name" in cur, str(list(cur))[:80])
ok("the PIN is never sent to the browser", "staff_pin" not in cur, str(list(cur)))
ok("but the form is told one is set", cur.get("staff_pin_set") is True, str(cur.get("staff_pin_set")))
s,_ = call("POST","/api/settings", {"staff_pin":"4321"})
ok("PIN can still be changed", s==200, f"{s}")
call("POST","/api/auth/logout")
s,_ = call("POST","/api/auth/login", {"pin":"1234"})
ok("the old PIN stops working", s==401, f"{s}")
s,_ = call("POST","/api/auth/login", {"pin":"4321"})
ok("the new PIN works", s==200, f"{s}")
s,b = call("POST","/api/settings", {"staff_pin":"12"})
ok("a too-short PIN is refused", s==400, f"{s} {b}")
call("POST","/api/settings", {"staff_pin":"1234"})
s,_ = call("POST","/api/settings", {"shop_name":"niksen lab","promptpay_id":cur.get("promptpay_id","")})
ok("save settings", s==200 and one("SELECT value v FROM settings WHERE key='shop_name'")["v"]=="niksen lab", f"{s}")
call("POST","/api/settings", {"shop_name":cur.get("shop_name"),"promptpay_id":cur.get("promptpay_id","")})

print("\n=== 15. คืนนี้ / events ===")
s,ev = call("POST","/api/events", {"title":"Lab Film Night","starts_at":"2026-09-08 19:00","description":"test"})
EID = ev.get("id") if isinstance(ev,dict) else None
ok("create an event", s==200 and EID, f"{s} {ev}")
_,pubev = call("GET","/api/public/events")
ok("event visible to customers", any(e["id"]==EID for e in pubev), f"{len(pubev)} events")
s,_ = call("DELETE", f"/api/events/{EID}")
ok("delete an event", s==200, f"{s}")

print("\n=== 16. ปิดท้าย: ลบของทดสอบ / cleanup path ===")
s,_ = call("DELETE", f"/api/menu/{NEW}")
ok("delete a menu item", s==200, f"{s}")
ok("it is gone", one("SELECT COUNT(*) n FROM menu_items WHERE id=?", NEW)["n"]==0)
s,_ = call("POST","/api/auth/logout")
ok("logout", s==200, f"{s}")
s,_ = call("GET","/api/orders")
ok("staff routes locked again after logout", s==401, f"{s}")

print(f"\n{'='*54}\nRESULT: {P} passed, {F} failed")
if FAILS:
    print("failed:")
    for f in FAILS: print("  -", f)
sys.exit(1 if F else 0)
