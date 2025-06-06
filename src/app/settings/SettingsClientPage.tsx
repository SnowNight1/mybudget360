//src/app/settings/SettingClientPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { string } from 'zod';
import { set } from 'date-fns';

interface SettingClientPageProps {
    currentDefaultRedirectPath: string | null;
}

export default function SettingClientPage({ currentDefaultRedirectPath }: SettingClientPageProps){
    const [selectedPath, setSelectedPath] = useState(currentDefaultRedirectPath || '/dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const [message,setMessage] = useState<{type: 'success' | 'error'; text: string } | null>(null);
    const {update: updateSession} = useSession();
    
    useEffect(() => {
        setSelectedPath(currentDefaultRedirectPath || '/dashboard');
    },[currentDefaultRedirectPath]);

    const handleSunmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/user/settings',{
                method: 'PUT',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({defaultRedirectPath:selectedPath}),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({type:'success',text:'设置已成功保存！'});
                await updateSession({defaultRedirectPath: selectedPath});
            } else {
                setMessage({type:'error',text: data.error || '保存失败，请重试。'});
            }
        } catch (error) {
            console.error('保存设置时出错：', error);
            setMessage({type:'error',text:'发生网络错误，请稍后重试。'});
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='max-w-2xl mx-auto p-4 sm:p-6 lg:p-8'>
            <h1 className='text-2xl font-semibold text-gray-900 mb-6'>
                用户设置
            </h1>
            <form onSubmit={handleSunmit} className='space-y-6 bg-white p-6 shadow rounded-lg'>
                <div>
                    <label className='text-base font-medium text-gray-900'>登陆后默认跳转界面</label>
                    <p className='text-sm text-gray-500 mb-2'>选择你每次新打开界面之后首先看到的页面</p>
                    <RadioGroup
                    value={selectedPath}
                    onValueChange={(value) => setSelectedPath(value)}
                    className='mt-2 space-y-2'
                    >
                        <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='/dashboard' id='redirect-dashboard'/>
                            <Label htmlFor='redirect-dashboard' className='font-normal'>
                                仪表盘
                            </Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='/records' id='redirect-records'/>
                            <Label htmlFor='redirect-records' className='font-normal'>
                                消费记录
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {message && (
                    <div className={`p-3 rounded-md text-sm ${message.type === 'success'? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                    </div>
                )}
                <Button type="submit" disabled={isLoading} 
                className='w-full sm:w-auto'>
                    {isLoading? '保存中....' : '保存偏好设置'}
                </Button>
            </form>
        </div>
    );
}