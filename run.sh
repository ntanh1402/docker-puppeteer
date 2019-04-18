#!/bin/sh
mkdir -p /dev/net
mknod /dev/net/tun c 10 200

openvpn --config openvpn/config.ovpn --auth-user-pass openvpn/auth --ca openvpn/ca.crt --daemon --log openvpn/log && xvfb-run -a -e /dev/stdout npm start