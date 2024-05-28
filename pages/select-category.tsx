import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '../components/provider/SocketProvider';
import { CategoryCountMap } from '../types';

const categories = [
  '동물',
  '과일',
  '채소',
  '직업',
  '국가',
  '색깔',
  '가전제품',
  '운동',
  '음식',
  '음악 장르',
];

const SelectCategory = () => {
  const router = useRouter();
  const [isSelected, setSelected] = useState(false);
  const { socket } = useSocket();
  const [categoryMap, setCategoryMap] = useState<CategoryCountMap>({});

  useEffect(() => {
    if (socket) {
      socket.on('updateCategories', (categoryMap: CategoryCountMap) => {
        console.log('Updated Categories:', categoryMap);
        setCategoryMap(categoryMap);
      });

      socket.on('successSelectCategories', (maxCategory: string) => {
        router.push(`/word/${maxCategory}`);
      });

      return () => {
        socket.off('updateCategories');
        socket.off('successSelectCategories');
      };
    }
  }, [socket, router]);

  const handleCategorySelect = (category: string) => {
    if (socket) {
      socket.emit('selectCategory', category);
      setSelected(!isSelected);
    }
  };

  return (
    <div>
      <h1>범주 선택</h1>
      <ul>
        {categories.map((category, index) => (
          <li key={index}>
            <button
              onClick={() => handleCategorySelect(category)}
              disabled={isSelected}
            >
              {category}
            </button>
            <span>: {categoryMap[category]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SelectCategory;
