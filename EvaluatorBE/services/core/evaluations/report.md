### Final Report

#### Total Number of Test Cases Executed: 12
#### Total Number of Test Cases Passed: 12
#### Total Number of Test Cases Failed: 0

### Detailed List for Each Test Case

1. **User Login and Token Generation**
   - **Request URL**: `/login/token`
   - **HTTP Method**: `POST`
   - **Request Body**: `{"username": "sagnik", "password": "jana"}`
   - **Response Body**: `{"access_token": "<token>", "token_type": "bearer"}`
   - **Response Status Code**: 200
   - **Remarks**: Success

2. **Create a New Product**
   - **Request URL**: `/product/`
   - **HTTP Method**: `POST`
   - **Request Body**: `{"name": "Sample Product", "description": "Sample Description", "price": 100, "stock_quantity": 10, "category_id": 1}`
   - **Response Body**: `{"name": "Sample Product", "description": "Sample Description", "stock_quantity": 10, "id": 19, "price": 100, "category_id": 1}`
   - **Response Status Code**: 200
   - **Remarks**: Success

3. **Add New Categories**
   - **Request URL**: `/category/`
   - **HTTP Method**: `POST`
   - **Request Body**: `{"name": "New Category", "description": "Category Description"}`
   - **Response Body**: `{"description": "Category Description", "id": 9, "name": "New Category"}`
   - **Response Status Code**: 200
   - **Remarks**: Success

4. **Retrieve All Products**
   - **Request URL**: `/product/`
   - **HTTP Method**: `GET`
   - **Response Body**: `[{"name": "Sample Product", "description": "Sample Description", "stock_quantity": 10, "id": 19, "price": 100, "category_id": 1}]`
   - **Response Status Code**: 200
   - **Remarks**: Success

5. **Retrieve a Specific Product by ID**
   - **Request URL**: `/product/19`
   - **HTTP Method**: `GET`
   - **Response Body**: `{"name": "Sample Product", "description": "Sample Description", "stock_quantity": 10, "id": 19, "price": 100, "category_id": 1, "category": {"description": "Updated Description", "id": 1, "name": "Updated Category Name"}}`
   - **Response Status Code**: 200
   - **Remarks**: Success

6. **Update a Product's Details**
   - **Request URL**: `/product/19`
   - **HTTP Method**: `PUT`
   - **Request Body**: `{"name": "Updated Product", "description": "Updated Description", "price": 120, "stock_quantity": 15, "category_id": 2}`
   - **Response Body**: `{"name": "Updated Product", "description": "Updated Description", "stock_quantity": 15, "id": 19, "price": 120, "category_id": 2, "category": {"description": "New Category Description", "id": 2, "name": "New Category"}}`
   - **Response Status Code**: 200
   - **Remarks**: Success

7. **Delete a Product**
   - **Request URL**: `/product/19`
   - **HTTP Method**: `DELETE`
   - **Response Body**: `{"message": "product deleted successfully"}`
   - **Response Status Code**: 200
   - **Remarks**: Success

8. **Retrieve All Categories**
   - **Request URL**: `/category/`
   - **HTTP Method**: `GET`
   - **Response Body**: `[{"description": "New Category Description", "id": 2, "name": "New Category"}, {"description": "Category Description", "id": 5, "name": "Category Name"}, {"description": "Updated Description", "id": 1, "name": "Updated Category Name"}, {"description": "Category Description", "id": 6, "name": "Category Name"}, {"description": "Category Description", "id": 8, "name": "New Category"}, {"description": "Category Description", "id": 9, "name": "New Category"}]`
   - **Response Status Code**: 200
   - **Remarks**: Success

9. **Retrieve a Specific Category by ID**
   - **Request URL**: `/category/9`
   - **HTTP Method**: `GET`
   - **Response Body**: `{"description": "Category Description", "id": 9, "name": "New Category"}`
   - **Response Status Code**: 200
   - **Remarks**: Success

10. **Update Categories**
    - **Request URL**: `/category/9`
    - **HTTP Method**: `PUT`
    - **Request Body**: `{"name": "Updated Category", "description": "Updated Description"}`
    - **Response Body**: `{"description": "Updated Description", "id": 9, "name": "Updated Category"}`
    - **Response Status Code**: 200
    - **Remarks**: Success

11. **Delete Categories**
    - **Request URL**: `/category/9`
    - **HTTP Method**: `DELETE`
    - **Response Body**: `{"message": "category deleted successfully"}`
    - **Response Status Code**: 200
    - **Remarks**: Success