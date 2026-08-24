#!/usr/bin/env bash
# Temporary stand-in until real layer binaries are copied into the image.
# Usage: stamped-stub-process <name> <port>
# port=0 → sleep-forever worker (no HTTP)
set -euo pipefail

NAME="${1:?name}"
PORT="${2:?port}"

trap 'echo "[$NAME] got SIGTERM"; exit 0' TERM INT

if [[ "$PORT" == "0" ]]; then
  echo "[$NAME] worker stub running (no listen port)"
  while true; do sleep 3600 & wait $! || true; done
fi

echo "[$NAME] HTTP stub on :$PORT"
# Minimal Python HTTP so healthcheck works without extra deps packaged yet.
exec python3 - "$NAME" "$PORT" <<'PY'
import http.server, socketserver, sys, signal

name, port = sys.argv[1], int(sys.argv[2])

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body = b'{"ok":true,"service":"%s"}' % name.encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, *_args):
        pass

def _stop(*_):
    raise SystemExit(0)

signal.signal(signal.SIGTERM, _stop)
signal.signal(signal.SIGINT, _stop)
with socketserver.TCPServer(("0.0.0.0", port), H) as httpd:
    httpd.serve_forever()
PY
