#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

# Change to the project directory
os.chdir('/Users/salehalzaid/Documents/massdeigners/salamah_rounds')

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

if __name__ == "__main__":
    PORT = 3000
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 خادم اختبار يعمل على المنفذ {PORT}")
        print(f"📡 يمكن الوصول إليه عبر: http://localhost:{PORT}")
        print("⏹️  اضغط Ctrl+C لإيقاف الخادم")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n⏹️  تم إيقاف الخادم")
            sys.exit(0)
