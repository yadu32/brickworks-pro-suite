#!/usr/bin/env python3
"""
Backend API Test Suite for Production Entry Flow
Tests the complete flow: Register -> Login -> Create Factory -> Create Product -> Create Production
"""

import requests
import json
import uuid
from datetime import datetime, date
import sys
import os

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://brick-factory-app-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class BrickworksAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.user_data = None
        self.factory_data = None
        self.product_data = None
        self.production_data = None
        
    def set_auth_header(self):
        """Set authorization header for authenticated requests"""
        if self.access_token:
            self.session.headers.update({
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            })
    
    def test_health_check(self):
        """Test API health check"""
        print("🔍 Testing API Health Check...")
        try:
            response = self.session.get(f"{API_BASE}/health")
            if response.status_code == 200:
                print("✅ API Health Check: PASSED")
                return True
            else:
                print(f"❌ API Health Check: FAILED - Status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API Health Check: FAILED - {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        # Generate unique email for testing
        test_email = f"testuser_{uuid.uuid4().hex[:8]}@brickworks.com"
        test_password = "SecurePassword123!"
        
        registration_data = {
            "email": test_email,
            "password": test_password
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/auth/register",
                json=registration_data
            )
            
            if response.status_code == 201:
                data = response.json()
                self.access_token = data.get('access_token')
                self.user_data = {
                    'email': test_email,
                    'password': test_password,
                    'user_info': data.get('user')
                }
                print("✅ User Registration: PASSED")
                print(f"   User ID: {self.user_data['user_info']['id']}")
                print(f"   Email: {self.user_data['email']}")
                return True
            else:
                print(f"❌ User Registration: FAILED - Status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ User Registration: FAILED - {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        if not self.user_data:
            print("❌ User Login: FAILED - No user data available")
            return False
        
        login_data = {
            "email": self.user_data['email'],
            "password": self.user_data['password']
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=login_data
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                self.set_auth_header()
                print("✅ User Login: PASSED")
                print(f"   Token received: {self.access_token[:20]}...")
                return True
            else:
                print(f"❌ User Login: FAILED - Status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ User Login: FAILED - {str(e)}")
            return False
    
    def test_factory_creation(self):
        """Test factory creation"""
        print("\n🔍 Testing Factory Creation...")
        
        if not self.access_token:
            print("❌ Factory Creation: FAILED - No access token")
            return False
        
        factory_data = {
            "name": f"Test Brick Factory {uuid.uuid4().hex[:8]}",
            "location": "Test City, Test State",
            "owner_name": "Test Owner",
            "contact_number": "+1234567890"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/factories",
                json=factory_data
            )
            
            if response.status_code == 201:
                self.factory_data = response.json()
                print("✅ Factory Creation: PASSED")
                print(f"   Factory ID: {self.factory_data['id']}")
                print(f"   Factory Name: {self.factory_data['name']}")
                return True
            else:
                print(f"❌ Factory Creation: FAILED - Status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Factory Creation: FAILED - {str(e)}")
            return False
    
    def test_product_creation(self):
        """Test product creation (brick type)"""
        print("\n🔍 Testing Product Creation...")
        
        if not self.factory_data:
            print("❌ Product Creation: FAILED - No factory data")
            return False
        
        product_data = {
            "name": "Standard Red Brick",
            "factory_id": self.factory_data['id'],
            "items_per_punch": 10,
            "size_description": "9x4x3 inches",
            "unit": "pieces"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/products",
                json=product_data
            )
            
            if response.status_code == 201:
                self.product_data = response.json()
                print("✅ Product Creation: PASSED")
                print(f"   Product ID: {self.product_data['id']}")
                print(f"   Product Name: {self.product_data['name']}")
                return True
            else:
                print(f"❌ Product Creation: FAILED - Status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Product Creation: FAILED - {str(e)}")
            return False
    
    def test_get_factory_products(self):
        """Test getting factory products"""
        print("\n🔍 Testing Get Factory Products...")
        
        if not self.factory_data:
            print("❌ Get Factory Products: FAILED - No factory data")
            return False
        
        try:
            response = self.session.get(
                f"{API_BASE}/products/factory/{self.factory_data['id']}"
            )
            
            if response.status_code == 200:
                products = response.json()
                print("✅ Get Factory Products: PASSED")
                print(f"   Found {len(products)} products")
                if products:
                    print(f"   First product: {products[0]['name']} (ID: {products[0]['id']})")
                return True
            else:
                print(f"❌ Get Factory Products: FAILED - Status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get Factory Products: FAILED - {str(e)}")
            return False
    
    def test_production_creation(self):
        """Test production log creation - This is the main test for the UUID bug fix"""
        print("\n🔍 Testing Production Creation (Main Test for UUID Bug Fix)...")
        
        if not self.product_data or not self.factory_data:
            print("❌ Production Creation: FAILED - Missing product or factory data")
            return False
        
        # Test with valid product_id (should work after bug fix)
        production_data = {
            "factory_id": self.factory_data['id'],
            "product_id": self.product_data['id'],  # This should be a valid UUID now
            "product_name": self.product_data['name'],
            "quantity": 1000,
            "punches": 100,
            "remarks": "Test production entry"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/production",
                json=production_data
            )
            
            if response.status_code == 201:
                self.production_data = response.json()
                print("✅ Production Creation: PASSED")
                print(f"   Production ID: {self.production_data['id']}")
                print(f"   Product ID: {self.production_data['product_id']}")
                print(f"   Quantity: {self.production_data['quantity']}")
                print("   🎉 UUID Bug Fix: CONFIRMED WORKING")
                return True
            elif response.status_code == 422:
                print("❌ Production Creation: FAILED - 422 Validation Error (UUID Bug Still Present)")
                print(f"   Response: {response.text}")
                try:
                    error_detail = response.json()
                    print(f"   Error Details: {json.dumps(error_detail, indent=2)}")
                except:
                    pass
                return False
            else:
                print(f"❌ Production Creation: FAILED - Status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Production Creation: FAILED - {str(e)}")
            return False
    
    def test_production_creation_with_empty_product_id(self):
        """Test production creation with empty product_id to verify validation"""
        print("\n🔍 Testing Production Creation with Empty Product ID...")
        
        if not self.factory_data:
            print("❌ Production Creation (Empty ID): FAILED - No factory data")
            return False
        
        # Test with empty product_id (should fail with proper validation)
        production_data = {
            "factory_id": self.factory_data['id'],
            "product_id": "",  # Empty product_id should be rejected
            "product_name": "Test Product",
            "date": str(date.today()),
            "quantity": 1000,
            "punches": 100,
            "remarks": "Test with empty product ID"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/production",
                json=production_data
            )
            
            if response.status_code == 422:
                print("✅ Production Creation (Empty ID): PASSED - Properly rejected empty product_id")
                return True
            else:
                print(f"❌ Production Creation (Empty ID): FAILED - Should have rejected empty product_id")
                print(f"   Status: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Production Creation (Empty ID): FAILED - {str(e)}")
            return False
    
    def test_get_factory_production(self):
        """Test getting factory production logs"""
        print("\n🔍 Testing Get Factory Production...")
        
        if not self.factory_data:
            print("❌ Get Factory Production: FAILED - No factory data")
            return False
        
        try:
            response = self.session.get(
                f"{API_BASE}/production/factory/{self.factory_data['id']}"
            )
            
            if response.status_code == 200:
                productions = response.json()
                print("✅ Get Factory Production: PASSED")
                print(f"   Found {len(productions)} production records")
                if productions:
                    latest = productions[0]
                    print(f"   Latest record: {latest['product_name']} - {latest['quantity']} units")
                return True
            else:
                print(f"❌ Get Factory Production: FAILED - Status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get Factory Production: FAILED - {str(e)}")
            return False
    
    def run_complete_test_suite(self):
        """Run the complete test suite for production entry flow"""
        print("🚀 Starting Complete Production Entry Flow Test Suite")
        print("=" * 60)
        
        test_results = []
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Factory Creation", self.test_factory_creation),
            ("Product Creation", self.test_product_creation),
            ("Get Factory Products", self.test_get_factory_products),
            ("Production Creation (Main Test)", self.test_production_creation),
            ("Production Creation (Empty ID Validation)", self.test_production_creation_with_empty_product_id),
            ("Get Factory Production", self.test_get_factory_production),
        ]
        
        for test_name, test_func in tests:
            result = test_func()
            test_results.append((test_name, result))
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:<40} {status}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print(f"\nTotal Tests: {len(test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        if failed == 0:
            print("\n🎉 ALL TESTS PASSED! Production entry flow is working correctly.")
            print("✅ UUID Bug Fix: CONFIRMED WORKING")
        else:
            print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")
            
            # Check specifically for production creation failure
            production_test_result = next((result for name, result in test_results if "Production Creation (Main Test)" in name), None)
            if production_test_result is False:
                print("❌ CRITICAL: Production Creation still failing - UUID bug may not be fixed")
        
        return failed == 0

def main():
    """Main function to run the test suite"""
    print("Brickworks Pro Suite - Backend API Test Suite")
    print(f"Testing against: {API_BASE}")
    print()
    
    tester = BrickworksAPITester()
    success = tester.run_complete_test_suite()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()