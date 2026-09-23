#!/usr/bin/env python3
"""
Backend API Tests for DEAR DOLLAR Admin Panel
Tests the internal health endpoint only (all business APIs are external)
"""

import requests
import json
import sys

# Base URL from .env NEXT_PUBLIC_BASE_URL
BASE_URL = "https://admin-panel-476.preview.emergentagent.com"

def test_health_get():
    """Test GET /api/health returns 200 with correct JSON"""
    print("\n=== Test 1: GET /api/health ===")
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        if data.get('service') != 'dear-dollar-admin-panel':
            print(f"❌ FAILED: Expected service='dear-dollar-admin-panel', got {data.get('service')}")
            return False
        
        if data.get('status') != 'ok':
            print(f"❌ FAILED: Expected status='ok', got {data.get('status')}")
            return False
        
        if 'note' not in data:
            print(f"❌ FAILED: Missing 'note' field in response")
            return False
        
        print("✅ PASSED: GET /api/health returns correct response")
        return True
    except Exception as e:
        print(f"❌ FAILED: Exception occurred - {str(e)}")
        return False

def test_health_post():
    """Test POST /api/health returns 200 with correct JSON"""
    print("\n=== Test 2: POST /api/health ===")
    try:
        response = requests.post(f"{BASE_URL}/api/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        if data.get('service') != 'dear-dollar-admin-panel':
            print(f"❌ FAILED: Expected service='dear-dollar-admin-panel', got {data.get('service')}")
            return False
        
        if data.get('status') != 'ok':
            print(f"❌ FAILED: Expected status='ok', got {data.get('status')}")
            return False
        
        if 'note' not in data:
            print(f"❌ FAILED: Missing 'note' field in response")
            return False
        
        print("✅ PASSED: POST /api/health returns correct response")
        return True
    except Exception as e:
        print(f"❌ FAILED: Exception occurred - {str(e)}")
        return False

def test_catchall_route():
    """Test GET /api/anything-else also returns the same health JSON (catch-all)"""
    print("\n=== Test 3: GET /api/anything-else (catch-all) ===")
    try:
        response = requests.get(f"{BASE_URL}/api/anything-else", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        if data.get('service') != 'dear-dollar-admin-panel':
            print(f"❌ FAILED: Expected service='dear-dollar-admin-panel', got {data.get('service')}")
            return False
        
        if data.get('status') != 'ok':
            print(f"❌ FAILED: Expected status='ok', got {data.get('status')}")
            return False
        
        if 'note' not in data:
            print(f"❌ FAILED: Missing 'note' field in response")
            return False
        
        print("✅ PASSED: GET /api/anything-else returns correct response (catch-all working)")
        return True
    except Exception as e:
        print(f"❌ FAILED: Exception occurred - {str(e)}")
        return False

def test_login_page():
    """Test GET /login returns 200 (page serves)"""
    print("\n=== Test 4: GET /login (page serves) ===")
    try:
        response = requests.get(f"{BASE_URL}/login", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        # Check if it's HTML content
        content_type = response.headers.get('content-type', '')
        if 'html' not in content_type.lower():
            print(f"⚠️  WARNING: Expected HTML content, got {content_type}")
        
        print("✅ PASSED: GET /login returns 200")
        return True
    except Exception as e:
        print(f"❌ FAILED: Exception occurred - {str(e)}")
        return False

def test_dashboard_page():
    """Test GET /dashboard returns 200 (page serves; client-side guard handles redirect)"""
    print("\n=== Test 5: GET /dashboard (page serves) ===")
    try:
        # Note: We're not following redirects to test that the page serves
        # The client-side guard will handle the redirect to /login
        response = requests.get(f"{BASE_URL}/dashboard", timeout=10, allow_redirects=True)
        print(f"Status Code: {response.status_code}")
        print(f"Final URL: {response.url}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        # Check if it's HTML content
        content_type = response.headers.get('content-type', '')
        if 'html' not in content_type.lower():
            print(f"⚠️  WARNING: Expected HTML content, got {content_type}")
        
        print("✅ PASSED: GET /dashboard returns 200")
        return True
    except Exception as e:
        print(f"❌ FAILED: Exception occurred - {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("DEAR DOLLAR Admin Panel - Backend API Tests")
    print("Testing internal health endpoint only")
    print("(All business APIs are external by design)")
    print("=" * 60)
    
    results = []
    
    # Test internal API routes
    results.append(("GET /api/health", test_health_get()))
    results.append(("POST /api/health", test_health_post()))
    results.append(("GET /api/anything-else (catch-all)", test_catchall_route()))
    
    # Test page routes
    results.append(("GET /login", test_login_page()))
    results.append(("GET /dashboard", test_dashboard_page()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("=" * 60)
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)

if __name__ == "__main__":
    main()
