'use client';

import { useState, useEffect } from 'react';
import { X, ArrowDownUp, TrendingUp, AlertCircle, CheckCircle, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { getRates, type ExchangeRates } from '@/lib/rates/ratesService';

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance?: {
    USDT: number;
    TRX: number;
    RUB: number;
  };
}

type Currency = 'USDT' | 'TRX' | 'RUB';

export default function ExchangeModal({ isOpen, onClose, userBalance }: ExchangeModalProps) {
  const [fromCurrency, setFromCurrency] = useState<Currency>('USDT');
  const [toCurrency, setToCurrency] = useState<Currency>('RUB');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchCurrentRates = async () => {
        try {
          const response = await fetch('/api/rates');
          const data = await response.json();
          if (data.success && data.rates) {
            setRates(data.rates);
            console.log('📊 Exchange rates loaded from API:', data.rates);
          }
        } catch (error) {
          console.error('❌ Error fetching rates:', error);
          // Fallback to cached rates
          const currentRates = getRates();
          setRates(currentRates);
          console.log('📊 Exchange rates loaded from cache:', currentRates);
        }
      };

      fetchCurrentRates();

      const interval = setInterval(() => {
        fetchCurrentRates();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const getExchangeRate = (from: Currency, to: Currency): number => {
    if (!rates) return 0;
    if (from === to) return 1;

    if (from === 'USDT' && to === 'RUB') return rates.USDT_TO_RUB;
    if (from === 'RUB' && to === 'USDT') return rates.RUB_TO_USDT;
    if (from === 'TRX' && to === 'RUB') return rates.TRX_TO_RUB;
    if (from === 'RUB' && to === 'TRX') return rates.RUB_TO_TRX;
    
    if (from === 'TRX' && to === 'USDT') {
      return rates.TRX_TO_RUB * rates.RUB_TO_USDT;
    }
    if (from === 'USDT' && to === 'TRX') {
      return rates.USDT_TO_RUB * rates.RUB_TO_TRX;
    }

    return 0;
  };

  useEffect(() => {
    if (!fromAmount || fromAmount === '0' || !rates || fromCurrency === toCurrency) {
      setToAmount('');
      return;
    }

    setIsCalculating(true);
    
    const timeout = setTimeout(() => {
      const rate = getExchangeRate(fromCurrency, toCurrency);
      const amount = parseFloat(fromAmount);
      
      if (rate > 0 && !isNaN(amount)) {
        const calculated = amount * rate;
        // Без комиссии - курс уже включает все fees
        const final = calculated;
        
        setToAmount(final.toFixed(6));
      }
      
      setIsCalculating(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [fromAmount, fromCurrency, toCurrency, rates]);

  const handleSwapCurrencies = () => {
    const tempFrom = fromCurrency;
    const tempAmount = fromAmount;
    
    setFromCurrency(toCurrency);
    setToCurrency(tempFrom);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSetMax = () => {
    if (userBalance && userBalance[fromCurrency]) {
      setFromAmount(userBalance[fromCurrency].toFixed(6));
    }
  };

  const handleExchange = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      alert('❌ Введите сумму для обмена');
      return;
    }

    if (fromCurrency === toCurrency) {
      alert('❌ Выберите разные валюты');
      return;
    }

    if (userBalance && userBalance[fromCurrency] < parseFloat(fromAmount)) {
      alert('❌ Недостаточно средств на балансе');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromCurrency,
          to: toCurrency,
          fromAmount: parseFloat(fromAmount),
          toAmount: parseFloat(toAmount),
          rate: getExchangeRate(fromCurrency, toCurrency),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Exchange failed');
      }

      const data = await response.json();

      alert(`✅ Обмен выполнен! Получено: ${data.received} ${toCurrency}`);
      
      setFromAmount('');
      setToAmount('');
      onClose();
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ Exchange error:', error);
      alert(error instanceof Error ? error.message : '❌ Ошибка при обмене');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentRate = getExchangeRate(fromCurrency, toCurrency);
  const hasInsufficientBalance = userBalance && fromAmount && userBalance[fromCurrency] < parseFloat(fromAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              💱 Обмен валюты
            </h2>
            <p className="text-sm text-gray-500 mt-1">Быстрый и безопасный обмен</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {rates ? (
          <div className="mb-6 p-4 bg-moneteum/5 rounded-xl border border-moneteum/20 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-moneteum" />
                <span className="font-semibold text-gray-700">Актуальные курсы</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <RefreshCw className="w-3 h-3" />
                <span>{new Date(rates.lastUpdated).toLocaleTimeString('ru-RU')}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition">
                <p className="text-gray-600 text-xs mb-1">💵 1 USDT → RUB</p>
                <p className="font-bold text-moneteum">{rates.USDT_TO_RUB.toFixed(2)} ₽</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition">
                <p className="text-gray-600 text-xs mb-1">⚡ 1 TRX → RUB</p>
                <p className="font-bold text-moneteum">{rates.TRX_TO_RUB.toFixed(2)} ₽</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition">
                <p className="text-gray-600 text-xs mb-1">💰 1 RUB → USDT</p>
                <p className="font-bold text-moneteum">{rates.RUB_TO_USDT.toFixed(4)} USDT</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition">
                <p className="text-gray-600 text-xs mb-1">💰 1 RUB → TRX</p>
                <p className="font-bold text-moneteum">{rates.RUB_TO_TRX.toFixed(4)} TRX</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-100 rounded-xl flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            <span className="text-gray-600">Загрузка курсов...</span>
          </div>
        )}

        <div className="space-y-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex justify-between items-center">
              <span>Отдаёте:</span>
              {userBalance && userBalance[fromCurrency] > 0 && (
                <button
                  onClick={handleSetMax}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                >
                  <Wallet className="w-3 h-3" />
                  MAX: {userBalance[fromCurrency].toFixed(2)} {fromCurrency}
                </button>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-moneteum focus:border-moneteum text-lg font-medium transition outline-none"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as Currency)}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-moneteum focus:border-moneteum font-medium bg-white cursor-pointer outline-none"
              >
                <option value="USDT">💵 USDT</option>
                <option value="TRX">⚡ TRX</option>
                <option value="RUB">🇷🇺 RUB</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center -my-2">
            <button
              onClick={handleSwapCurrencies}
              disabled={!fromAmount || !toAmount || fromAmount === '' || toAmount === ''}
              className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 rounded-full transition shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <ArrowDownUp className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Получаете:
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={toAmount}
                  readOnly
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-lg font-medium"
                />
                {isCalculating && (
                  <Loader2 className="w-5 h-5 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-500" />
                )}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as Currency)}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-moneteum focus:border-moneteum font-medium bg-white cursor-pointer outline-none"
              >
                <option value="USDT">💵 USDT</option>
                <option value="TRX">⚡ TRX</option>
                <option value="RUB">🇷🇺 RUB</option>
              </select>
            </div>
          </div>

          {currentRate > 0 && fromCurrency !== toCurrency && (
            <div className="p-4 bg-moneteum/5 border-2 border-moneteum/20 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  💹 Курс обмена:
                </span>
                <span className="text-lg font-bold text-moneteum">
                  1 {fromCurrency} = {currentRate.toFixed(6)} {toCurrency}
                </span>
              </div>
            </div>
          )}

          {toAmount && parseFloat(toAmount) > 0 && (
            <div className="bg-moneteum/5 border-2 border-moneteum/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-moneteum" />
                <span className="font-semibold text-gray-700 text-sm">Детали операции</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Сумма обмена:</span>
                  <span className="font-medium">{fromAmount} {fromCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Комиссия сети:</span>
                  <span className="font-medium text-moneteum">~15 TRX</span>
                </div>
                <div className="border-t border-moneteum/30 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-base">
                    <span className="text-gray-800">Итого получите:</span>
                    <span className="text-moneteum">{toAmount} {toCurrency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasInsufficientBalance && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Недостаточно средств на балансе</span>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              onClick={handleExchange}
              disabled={
                isLoading ||
                !fromAmount ||
                fromAmount === '' ||
                parseFloat(fromAmount) <= 0 ||
                !toAmount ||
                toAmount === '' ||
                fromCurrency === toCurrency ||
                (hasInsufficientBalance || false)
              }
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-medium transition disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Обмен...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Обменять
                </>
              )}
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-600">
            <p className="flex items-center gap-2">
              <span className="text-blue-600">ℹ️</span>
              Обмен происходит по актуальному курсу. Курсы обновляются каждые 30 секунд.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}