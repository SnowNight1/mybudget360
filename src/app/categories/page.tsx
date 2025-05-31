// /app/categories/page.tsx
"use client";

import { useEffect, useState } from 'react';
import type { CategoryData } from '@/app/api/categories/route'; // 确保路径正确


export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [, setIsModalOpen] = useState<boolean>(false);
  const [, setEditCategory] = useState<CategoryData | null>(null);

  const fecthCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: CategoryData[] = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || '获取分类失败');
      console.error('获取分类失败:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fecthCategories();
  }
  , []);

  const handleAddCategory = () => {
    setEditCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: CategoryData) => {
    setEditCategory(category);
    setIsModalOpen(true);
  };

  const handleFromSuccess = () => {
    setIsModalOpen(false);
    fecthCategories();
  }

  if (loading) return <p className="text-center py-10">正在加载分类...</p>;
  if (error) return <p className="text-center py-10 text-red-500">错误: {error}</p>;

    return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">カテゴリ管理</h1>
        {/* 
        <Button onClick={handleAddCategory}>
          新しいカテゴリを追加 (Add New Category)
        </Button>
        */}
        <button 
          onClick={handleAddCategory}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          新しいカテゴリを追加
        </button>
      </div>

      {/* 
        <CategoryList 
          categories={categories} 
          onEdit={handleEditCategory} 
          onDelete={async (categoryId) => {
            // 这里将添加删除逻辑
            if (confirm('このカテゴリを削除してもよろしいですか？')) {
              console.log('删除分类 ID:', categoryId);
              // await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
              // fetchCategories(); // 重新获取
            }
          }} 
        />
      */}
      <div>
        {categories.length === 0 ? (
          <p>カテゴリが見つかりませんでした。</p>
        ) : (
          <ul>
            {categories.map((category) => (
              <li key={category.id} className="mb-2 p-3 border rounded flex justify-between items-center" style={{ borderColor: category.color }}>
                <span style={{ color: category.color }}>■</span> {category.name}
                {/* <div>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditCategory(category)}>編集</Button>
                  <Button variant="destructive" size="sm" onClick={() => console.log('delete', category.id)}>削除</Button>
                </div> */}
              </li>
            ))}
          </ul>
        )}
      </div>


      {/* 
      {isModalOpen && (
        <CategoryFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleFormSuccess}
          categoryToEdit={editingCategory}
          allCategories={categories} // 用于父级分类选择
        />
      )}
      */}
    </main>
  );
}
