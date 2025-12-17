import { useState } from 'react';
import { PreviewData } from '../../../types/formTypes';

export const usePreviewData = () => {
  const [previewData, setPreviewData] = useState<PreviewData>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    address2: '',
    province: '',
    city: '', 
    zipCode: '',
    email: '',
    discountCode: ''
  });

  const [subscribeChecked, setSubscribeChecked] = useState(false);

  const updatePreviewData = (field: string, value: string) => {
    setPreviewData(prev => ({ ...prev, [field]: value }));
  };

  return {
    previewData,
    setPreviewData,
    subscribeChecked,
    setSubscribeChecked,
    updatePreviewData
  };
};