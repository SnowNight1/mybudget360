//src/app/settings/SettingClientPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { string } from 'zod';
import { set } from 'date-fns';
import { useSettingsTranslations, useCommonTranslations, useNavigationTranslations } from '@/hooks/useTranslations';

interface SettingClientPageProps {
    currentDefaultRedirectPath: string | null;
}

export default function SettingClientPage({ currentDefaultRedirectPath }: SettingClientPageProps){
    const [selectedPath, setSelectedPath] = useState(currentDefaultRedirectPath || '/dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const [message,setMessage] = useState<{type: 'success' | 'error'; text: string } | null>(null);
    const {update: updateSession} = useSession();
    const t = useSettingsTranslations();
    const common = useCommonTranslations();
    const nav = useNavigationTranslations();
    
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
                setMessage({type:'success',text: t('saveSuccess')});
                await updateSession({defaultRedirectPath: selectedPath});
            } else {
                setMessage({type:'error',text: data.error || t('saveError')});
            }
        } catch (error) {
            console.error('保存设置时出错：', error);
            setMessage({type:'error',text: t('networkError')});
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='max-w-2xl mx-auto p-4 sm:p-6 lg:p-8'>
            <h1 className='text-2xl font-semibold text-gray-900 mb-6'>
                {t('title')}
            </h1>
            <form onSubmit={handleSunmit} className='space-y-6 bg-white p-6 shadow rounded-lg'>
                <div>
                    <label className='text-base font-medium text-gray-900'>{t('defaultRedirect')}</label>
                    <p className='text-sm text-gray-500 mb-2'>{t('defaultRedirectDescription')}</p>
                    <RadioGroup
                    value={selectedPath}
                    onValueChange={(value) => setSelectedPath(value)}
                    className='mt-2 space-y-2'
                    >
                        <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='/dashboard' id='redirect-dashboard'/>
                            <Label htmlFor='redirect-dashboard' className='font-normal'>
                                {nav('dashboard')}
                            </Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='/records' id='redirect-records'/>
                            <Label htmlFor='redirect-records' className='font-normal'>
                                {nav('records')}
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
                    {isLoading? common('saving') : t('savePreferences')}
                </Button>
            </form>
        </div>
    );
}