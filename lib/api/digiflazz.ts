/**
 * Digiflazz API helpers
 *
 * Semua response dari backend kita berbentuk:
 *   { success: true, data: <payload_digiflazz> }
 *
 * Axios menambah satu layer: axiosRes.data = { success, data }
 * Jadi payload aktual ada di: axiosRes.data.data
 *
 * Contoh untuk transaksi:
 *   axiosRes.data.data = {
 *     ref_id, customer_no, buyer_sku_code,
 *     message, status, rc, sn, price, buyer_last_saldo
 *   }
 *
 * Contoh untuk balance:
 *   axiosRes.data.data = { deposit: 500000000 }
 *
 * Contoh untuk price-list:
 *   axiosRes.data.data = [ { product_name, buyer_sku_code, price, ... } ]
 */

import apiClient from './client';

export interface DigiBalance {
  deposit: number;
}

export interface DigiProduct {
  product_name:          string;
  category:              string;
  brand:                 string;
  type:                  string;
  price:                 number;
  buyer_sku_code:        string;
  buyer_product_status:  boolean;
  seller_product_status: boolean;
  unlimited_stock:       boolean;
  stock:                 number;
  multi:                 boolean;
  start_cut_off:         string;
  end_cut_off:           string;
  desc:                  string;
}

export interface DigiTxResult {
  ref_id:             string;
  customer_no:        string;
  buyer_sku_code:     string;
  message:            string;
  status:             'Sukses' | 'Pending' | 'Gagal' | string;
  rc:                 string;
  sn?:                string;
  buyer_last_saldo?:  number;
  price?:             number;
  tele?:              string;
  wa?:                string;
}

/** Cek saldo deposit Digiflazz */
export async function fetchBalance(): Promise<DigiBalance> {
  const res = await apiClient.get('/digiflazz/balance');
  // res.data = { success: true, data: { deposit: 500000000 } }
  return res.data.data as DigiBalance;
}

/** Ambil daftar harga (prepaid/pasca) */
export async function fetchPriceList(cmd: 'prepaid' | 'pasca' = 'prepaid'): Promise<DigiProduct[]> {
  const res = await apiClient.get('/digiflazz/price-list', { params: { cmd } });
  // res.data = { success: true, data: [ {...}, {...} ] }
  return (res.data.data ?? []) as DigiProduct[];
}

/** Kirim transaksi topup ke Digiflazz */
export async function sendTransaction(params: {
  refId:        string;
  buyerSkuCode: string;
  customerId:   string;
  testing?:     boolean;
}): Promise<DigiTxResult> {
  const res = await apiClient.post('/digiflazz/transaction', {
    refId:        params.refId,
    buyerSkuCode: params.buyerSkuCode,
    customerId:   params.customerId,
    testing:      params.testing ?? false,
  });
  // res.data = { success: true, data: { ref_id, status, rc, sn, ... } }
  return res.data.data as DigiTxResult;
}

/** Cek status transaksi Pending
 *  Wajib kirim sku & customer yang sama dengan transaksi asli
 */
export async function checkTxStatus(params: {
  refId:        string;
  buyerSkuCode: string;
  customerId:   string;
}): Promise<DigiTxResult> {
  const res = await apiClient.get('/digiflazz/status', {
    params: {
      ref_id:   params.refId,
      sku:      params.buyerSkuCode,
      customer: params.customerId,
    },
  });
  // res.data = { success: true, data: { ref_id, status, rc, sn, ... } }
  return res.data.data as DigiTxResult;
}
