'use client';

import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';

// 새 공지를 띄우려면 id를 바꾸고 내용 수정.
const NOTICE = {
  id: '2026-07-09',
  title: '업데이트 안내',
  items: ['닉네임을 변경할 수 있어요 (내정보)', '방 멤버 목록을 확인할 수 있어요 (내정보)'],
};

const STORAGE_KEY = 'gram-notice-dismissed';

export default function NoticeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== NOTICE.id) setOpen(true);
  }, []);

  function dismissForever() {
    localStorage.setItem(STORAGE_KEY, NOTICE.id);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-30 flex items-end justify-center bg-black/40' onClick={() => setOpen(false)}>
      <div className='w-full max-w-[430px] rounded-t-[24px] bg-white p-6 pb-10' onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center gap-2 text-lg font-bold text-main'>
          <Info className='h-5 w-5 text-main' />
          {NOTICE.title}
        </div>
        <ul className='mt-4 flex flex-col gap-2.5'>
          {NOTICE.items.map((item) => (
            <li key={item} className='flex items-start gap-2 text-[15px] font-medium text-ink'>
              <span className='mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-main' />
              {item}
            </li>
          ))}
        </ul>
        <div className='mt-6 flex gap-2.5'>
          <button onClick={dismissForever} className='h-14 flex-1 rounded-2xl bg-gray-100 text-[15px] font-bold text-sub'>
            더 이상 보지 않기
          </button>
          <button onClick={() => setOpen(false)} className='h-14 flex-1 rounded-2xl bg-main text-[17px] font-bold text-white'>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
