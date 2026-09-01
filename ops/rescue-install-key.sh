#!/usr/bin/env bash
#
# Install the deploy key onto the real disk, from the Hetzner rescue system.
#
#   curl -fsSL https://raw.githubusercontent.com/jajahhhhhhh/MENU-App-niksen/main/ops/rescue-install-key.sh | bash
#
# Rescue is a Debian that lives entirely in RAM. Anything written to its own
# /root is thrown away on the next boot — which is why several rounds of
# "installing" the key from a rescue shell left the running server unchanged.
# The key has to be written to the installed system's disk, mounted here.
#
# Typing it by hand kept going wrong in the browser console: a dropped 'echo',
# a single '>' that would have truncated authorized_keys instead of appending,
# and run-together lines. So it is a script, and the key comes down with it.
set -euo pipefail

PART=${1:-/dev/sda1}
KEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKfeYqArLZbI7RtVPD7xlFd/RERg2emIhfPCNSCrf+Os niksen-deploy'

echo "== mounting $PART"
mountpoint -q /mnt || mount "$PART" /mnt
[ -d /mnt/root ] || { echo "no /root on $PART — wrong partition?" >&2; exit 1; }

mkdir -p /mnt/root/.ssh
chmod 700 /mnt/root/.ssh
touch /mnt/root/.ssh/authorized_keys

# Append, never overwrite: any key already trusted must keep working.
if grep -qF "niksen-deploy" /mnt/root/.ssh/authorized_keys; then
  echo "== key already present"
else
  echo "$KEY" >> /mnt/root/.ssh/authorized_keys
  echo "== key appended"
fi
chmod 600 /mnt/root/.ssh/authorized_keys

echo "== authorized_keys on the real disk now holds:"
grep -c 'ssh-' /mnt/root/.ssh/authorized_keys | sed 's/^/   /'
grep -o 'niksen-deploy' /mnt/root/.ssh/authorized_keys | head -1 | sed 's/^/   found: /'

sync
umount /mnt
echo
echo "== DONE. Now type:  reboot"
