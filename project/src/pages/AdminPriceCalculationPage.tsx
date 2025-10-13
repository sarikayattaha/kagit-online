import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit2, Plus, Trash2, Save, X, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProductRule {
  id?: string;
  type: string;
  weights: number[];
  common_dimensions: string[];
}

interface Product {
  id: string;
  product_type: string;
  weight: number;
  dimensions: string;
  sheets_per_package: number;
  ton_price: number;
  currency: string;
}

export default function AdminPriceCalculationPage() {
