
import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
}

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (id: number, name: string) => void;
  onDeleteProduct: (id: number) => void;
}

const Products: React.FC<ProductsProps> = ({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct 
}) => {
  const [newProductName, setNewProductName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddProduct = () => {
    if (newProductName.trim()) {
      onAddProduct({
        id: Date.now(),
        name: newProductName.trim()
      });
      setNewProductName('');
    }
  };

  const handleEditStart = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleEditSave = () => {
    if (editingId !== null && editingName.trim()) {
      onUpdateProduct(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="space-y-6">
      {/* Add New Product */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Product Name (e.g., Fish, Prawns, etc.)"
            onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
          />
          <button
            onClick={handleAddProduct}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="inline mr-2 h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Products List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Products List ({products.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {editingId === product.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleEditSave()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSave}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="font-medium">{product.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStart(product.id, product.name)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;
