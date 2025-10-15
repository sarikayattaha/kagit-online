import { useState, useEffect } from 'react';
import { User, Save, AlertCircle, CheckCircle, Package, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phone: '',
    taxNumber: ''
  });

  const [originalData, setOriginalData] = useState({ ...formData });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const profileInfo = {
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || user?.email || '',
          companyName: data.company_name || '',
          phone: data.phone || '',
          taxNumber: data.tax_number || ''
        };
        setFormData(profileInfo);
        setOriginalData(profileInfo);
      }
    } catch (error: any) {
      console.error('Profil yükleme hatası:', error);
      setMessage({ type: 'error', text: 'Profil bilgileri yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setMessage(null);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setMessage({ type: 'error', text: 'Ad alanı zorunludur' });
      return false;
    }
    if (!formData.lastName.trim()) {
      setMessage({ type: 'error', text: 'Soyad alanı zorunludur' });
      return false;
    }
    if (!formData.companyName.trim()) {
      setMessage({ type: 'error', text: 'Şirket adı zorunludur' });
      return false;
    }
    if (!formData.phone.trim()) {
      setMessage({ type: 'error', text: '
