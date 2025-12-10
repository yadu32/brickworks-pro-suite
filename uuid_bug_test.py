#!/usr/bin/env python3
"""
Focused test for the UUID bug fix in production entry
Tests the specific scenario mentioned in the review request
"""

import requests
import json
import uuid
import os

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://brick-data-rescue.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def test_uuid_bug_fix():
    """Test the specific UUID bug fix scenario"""
    print("🔍 Testing UUID Bug Fix for Production Entry")
    print("=" * 50)
    
    session = requests.Session()
    
    # Step 1: Register and login
    print("1. Registering new user...")
    test_email = f"uuidtest_{uuid.uuid4().hex[:8]}@brickworks.com"
    registration_data = {
        "email": test_email,
        "password": "TestPassword123!"
    }
    
    response = session.post(f"{API_BASE}/auth/register", json=registration_data)
    if response.status_code != 201:
        print(f"❌ Registration failed: {response.status_code}")
        return False
    
    token_data = response.json()
    access_token = token_data.get('access_token')
    
    session.headers.update({
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    })
    
    print("✅ User registered and logged in")
    
    # Step 2: Create factory
    print("2. Creating factory...")
    factory_data = {
        "name": f"UUID Test Factory {uuid.uuid4().hex[:8]}",
        "location": "Test Location",
        "owner_name": "Test Owner",
        "contact_number": "+1234567890"
    }
    
    response = session.post(f"{API_BASE}/factories", json=factory_data)
    if response.status_code != 201:
        print(f"❌ Factory creation failed: {response.status_code}")
        return False
    
    factory = response.json()
    factory_id = factory['id']
    print(f"✅ Factory created: {factory_id}")
    
    # Step 3: Create product (brick type)
    print("3. Creating product type (brick)...")
    product_data = {
        "name": "Test Red Brick",
        "factory_id": factory_id,
        "items_per_punch": 8,
        "size_description": "Standard size",
        "unit": "pieces"
    }
    
    response = session.post(f"{API_BASE}/products", json=product_data)
    if response.status_code != 201:
        print(f"❌ Product creation failed: {response.status_code}")
        return False
    
    product = response.json()
    product_id = product['id']
    print(f"✅ Product created: {product_id}")
    
    # Step 4: Get factory products to simulate dropdown loading
    print("4. Getting factory products (simulating dropdown load)...")
    response = session.get(f"{API_BASE}/products/factory/{factory_id}")
    if response.status_code != 200:
        print(f"❌ Failed to get products: {response.status_code}")
        return False
    
    products = response.json()
    if not products:
        print("❌ No products found")
        return False
    
    first_product = products[0]
    print(f"✅ Products loaded, first product: {first_product['name']} (ID: {first_product['id']})")
    
    # Step 5: Test production creation with valid UUID (the main fix)
    print("5. Testing production creation with valid product_id...")
    production_data = {
        "factory_id": factory_id,
        "product_id": first_product['id'],  # This should be a valid UUID now
        "product_name": first_product['name'],
        "quantity": 500,
        "punches": 50,
        "remarks": "UUID bug fix test"
    }
    
    response = session.post(f"{API_BASE}/production", json=production_data)
    
    if response.status_code == 201:
        production = response.json()
        print("✅ Production record created successfully!")
        print(f"   Production ID: {production['id']}")
        print(f"   Product ID: {production['product_id']}")
        print(f"   Quantity: {production['quantity']}")
        print("🎉 UUID BUG FIX CONFIRMED WORKING!")
        return True
    elif response.status_code == 422:
        print("❌ Production creation failed with 422 validation error")
        print("❌ UUID BUG STILL PRESENT")
        try:
            error_detail = response.json()
            print(f"   Error details: {json.dumps(error_detail, indent=2)}")
        except:
            print(f"   Raw response: {response.text}")
        return False
    else:
        print(f"❌ Production creation failed with status {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def main():
    print("UUID Bug Fix Test for Production Entry")
    print(f"Testing against: {API_BASE}")
    print()
    
    success = test_uuid_bug_fix()
    
    if success:
        print("\n🎉 SUCCESS: UUID bug fix is working correctly!")
        print("✅ Production records can be created without UUID validation errors")
    else:
        print("\n❌ FAILURE: UUID bug may still be present")
        print("⚠️  Production creation is failing with validation errors")
    
    return success

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)