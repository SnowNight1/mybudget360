// /app/categories/page.tsx
"use client";

import { useEffect, useState } from 'react';
import type { CategoryData } from '@/app/api/categories/route'; // 确保路径正确
import CategoryFormModal from '@/components/categories/CategoryFormModal'; // 假设你的模态框组件路径
import { Button } from '@/components/ui/button'; 
// (可选) 如果你想用更美观的列表组件
// import CategoryList from '@/components/categories/CategoryList'; 

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null); // 统一状态名

  const fetchCategories = async () => { // 修正拼写
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
    fetchCategories();
  }, []);

  const handleOpenAddModal = () => { // 用于打开添加模态框
    setEditingCategory(null); // 清除编辑状态，确保是添加模式
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: CategoryData) => { // 用于打开编辑模态框
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm('このカテゴリを本当に削除してもよろしいですか？この操作は元に戻せません。')) {
      return;
    }
    setLoading(true); // (可选) 可以添加一个针对删除操作的 loading 状态
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `删除失败，状态码: ${response.status}`);
      }
      // 删除成功
      fetchCategories(); // 重新获取列表以反映删除
    } catch (err: any) {
      setError(err.message || '删除分类时出错');
      console.error('删除分类失败:', err);
      // 即使删除失败，也可能需要刷新列表以获取最新状态，或者只显示错误
      // fetchCategories(); 
    } finally {
      setLoading(false); // (可选) 如果有删除 loading 状态，则重置
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null); // 关闭时清除编辑状态
  };

  const handleFormSuccess = () => { // 统一函数名
    handleModalClose();
    fetchCategories(); // 重新加载分类列表
  };

  if (loading && categories.length === 0) return <p className="text-center py-10">正在加载分类...</p>; // 只有在首次加载时显示
  if (error) return <p className="text-center py-10 text-red-500">错误: {error}</p>;

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">カテゴリ管理</h1>
        <Button onClick={handleOpenAddModal}> {/* 使用新的处理函数名 */}
          新しいカテゴリを追加
        </Button>
      </div>

      {/* 分类列表 */}
      {/* 
        如果你创建了 CategoryList 组件，可以这样使用:
        <CategoryList 
          categories={categories}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteCategory}
          isLoading={loading} // 可以传递 loading 状态给列表组件
        />
      */}
      <div>
        {categories.length === 0 && !loading ? (
          <p>カテゴリが見つかりませんでした。</p>
        ) : (
          <ul className="space-y-2"> {/* 添加 space-y-2 给列表项一些间距 */}
            {categories.map((category) => (
              <li 
                key={category.id} 
                className="p-3 border rounded-md flex justify-between items-center shadow-sm hover:shadow-md transition-shadow" // 添加一些样式
                style={{ borderLeft: `5px solid ${category.color}` }} // 使用左边框显示颜色
              >
                <div className="flex items-center">
                  <span 
                    className="w-4 h-4 rounded-sm mr-3 inline-block" 
                    style={{ backgroundColor: category.color }}
                    title={category.color} // 添加 title 显示颜色代码
                  />
                  <span className="font-medium">{category.name}</span> {/* 加粗名称 */}
                  {category.parentId && ( // 显示父级 ID (如果存在)
                    <span className="text-xs text-gray-500 ml-2">(Parent ID: {category.parentId})</span>
                  )}
                </div>
                <div className="space-x-2"> {/* 给按钮一些间距 */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenEditModal(category)} // 连接编辑处理函数
                  >
                    編集
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteCategory(category.id)} // 连接删除处理函数
                  >
                    削除
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {loading && categories.length > 0 && <p className="text-center py-4">更新中...</p>} {/* 列表已有时，显示更新中 */}
      </div>

      {/* 条件渲染 CategoryFormModal */}
      {isModalOpen && (
        <CategoryFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleFormSuccess}
          categoryToEdit={editingCategory} // 传递编辑状态
          allCategories={categories} // 传递所有分类用于父级选择器
        />
      )}
    </main>
  );
}