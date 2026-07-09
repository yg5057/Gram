'use client';

import { useState, useTransition } from 'react';
import { login, signup } from './actions';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isLogin = mode === 'login';

  function switchMode() {
    setMode(isLogin ? 'signup' : 'login');
    setError(null);
  }

  function submit() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = isLogin ? await login(email, password) : await signup({ email, password, name });
      // 성공 시 서버 액션이 redirect하므로 여기 도달하면 실패
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className='flex flex-1 flex-col bg-white px-7 pt-[60px]'>
      <div className='mt-6 flex flex-col items-center gap-[18px]'>
        <div className='flex h-[76px] w-[76px] items-center justify-center rounded-3xl bg-main shadow-[0_10px_24px_rgba(255,107,157,0.4)]'>
          <svg width='40' height='40' viewBox='0 0 24 24' fill='none'>
            <path d='M12 3.5c-4.7 0-8.5 3.4-8.5 7.6 0 2.5 1.4 4.7 3.5 6.1V21l3.2-1.8c.6.1 1.2.2 1.8.2 4.7 0 8.5-3.4 8.5-7.6S16.7 3.5 12 3.5Z' fill='#fff' />
            <circle cx='9' cy='11' r='1.4' fill='#FF6B9D' />
            <circle cx='15' cy='11' r='1.4' fill='#FF6B9D' />
          </svg>
        </div>
        <div className='text-center'>
          <div className='text-[27px] font-extrabold tracking-[-0.5px]'>Gram</div>
          <div className='mt-1.5 text-[15px] font-medium text-sub'>친구들과 함께 기록하는 몸무게</div>
        </div>
      </div>

      <form
        className='mt-11 flex flex-col gap-3'
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {!isLogin && (
          <Field label='이름'>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='닉네임을 입력해주세요'
              className='w-full bg-transparent text-base font-medium outline-none placeholder:text-faint'
            />
          </Field>
        )}
        <Field label='이메일'>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='example@gram.com'
            autoComplete='email'
            className='w-full bg-transparent text-base font-medium outline-none placeholder:text-faint'
          />
        </Field>
        <Field label='비밀번호'>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='••••••••'
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            className='w-full bg-transparent text-base font-medium tracking-[3px] outline-none placeholder:text-faint'
          />
        </Field>
        {error && <div className='px-1 text-[13px] font-medium text-main-dark'>{error}</div>}

        <button
          type='submit'
          disabled={pending}
          className='mt-2.5 h-14 rounded-2xl bg-main text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(255,107,157,0.35)] transition-colors hover:bg-main-dark disabled:opacity-60'
        >
          {pending ? '로그인 중...' : isLogin ? '로그인' : '가입하기'}
        </button>
      </form>

      <div className='my-[26px] flex items-center gap-3.5'>
        <div className='h-px flex-1 bg-line' />
        <div className='text-xs font-medium text-faint'>또는</div>
        <div className='h-px flex-1 bg-line' />
      </div>

      <button onClick={switchMode} className='rounded-2xl border-[1.5px] border-line-strong bg-white py-3.5 text-[15px] font-semibold'>
        {isLogin ? '이메일로 회원가입' : '이메일로 로그인'}
      </button>

      <div className='mt-auto mb-[26px] pt-8 text-center text-[13px] font-medium text-sub'>
        {isLogin ? '처음이신가요? ' : '계정이 있으신가요? '}
        <button onClick={switchMode} className='font-bold text-main'>
          {isLogin ? '회원가입' : '로그인'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className='block rounded-2xl border border-line bg-page px-[18px] py-4'>
      <div className='mb-[5px] text-xs font-semibold text-sub'>{label}</div>
      {children}
    </label>
  );
}
