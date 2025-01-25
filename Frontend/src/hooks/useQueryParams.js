import { useSearchParams } from 'react-router-dom';

export const useQueryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParams = Object.fromEntries(searchParams.entries());

  const setQueryParams = (params) => {
    const newParams = { ...queryParams, ...params };
    Object.keys(newParams).forEach(key => {
      if (newParams[key] === null || newParams[key] === undefined || newParams[key] === '') {
        delete newParams[key];
      }
    });
    setSearchParams(newParams);
  };

  return { queryParams, setQueryParams };
};
