import urllib.request
import json

accounts = [
    ('admin@workforce.ai', 'Admin@123', 'ADMIN'),
    ('hr@workforce.ai', 'Hr@123', 'HR'),
    ('manager@workforce.ai', 'Manager@123', 'MANAGER'),
    ('employee@workforce.ai', 'Employee@123', 'EMPLOYEE'),
]

print("--- TESTING LOGIN FOR ALL 4 ROLES ---")
for email, pwd, expected_role in accounts:
    try:
        data = json.dumps({'email': email, 'password': pwd}).encode('utf-8')
        req = urllib.request.Request(
            'http://127.0.0.1:8000/api/v1/auth/login',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            user = res.get('user', {})
            token = res.get('access_token')
            status = 'OK' if user.get('role') == expected_role else 'MISMATCH'
            print(f"[{status}] Email: {email} | Password: {pwd} | Role: {user.get('role')} | UserID: {user.get('id')} | Name: {user.get('full_name')}")
            
            # Now verify /auth/me
            me_req = urllib.request.Request(
                'http://127.0.0.1:8000/api/v1/auth/me',
                headers={'Authorization': f'Bearer {token}'}
            )
            with urllib.request.urlopen(me_req) as me_resp:
                me_res = json.loads(me_resp.read().decode('utf-8'))
                print(f"       -> /auth/me OK: {me_res.get('email')} ({me_res.get('role')})")
    except Exception as e:
        print(f"[FAIL] {email}: {e}")
