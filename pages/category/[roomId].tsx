import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '../../components/provider/SocketProvider';
import { CategoryCountMap, StringArrayMap } from '../../types';
import useRoomId from '../../hooks/useRoomId';
import Layout from "../Layout";

const SelectCategory = () => {
  const roomId = useRoomId();
  const router = useRouter();
  const [isSelected, setSelected] = useState(false);
  const { socket } = useSocket();
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryMap, setCategoryMap] = useState<CategoryCountMap>({});

  useEffect(() => {
    if (socket) {
      socket.emit('readyToSelectCategory', roomId);

      socket.on('initialCategories', (categories: string[]) => {
        setCategories(categories);
      });

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
  }, [socket, router, roomId]);

  const handleCategorySelect = (category: string) => {
    if (socket) {
      socket.emit('selectCategory', category);
      setSelected(!isSelected);
    }
  };

  return (
    <Layout>
      <h3>범주 선택</h3>
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
    </Layout>
  );
};

export default SelectCategory;
