'use client'

import React, { useState } from 'react'
import { CheckCircle2, MessageSquarePlus, Star } from 'lucide-react'
import { Product } from '@/types'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ProductReviews({ product }: { product: Product }) {
  const locale = useStore((s) => s.locale)
  const addProductReview = useStore((s) => s.addProductReview)
  const pushToast = useStore((s) => s.pushToast)

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !comment.trim()) return
    addProductReview(product.id, {
      user_name: name.trim(),
      rating,
      title: title.trim() || 'Great Flagship Product',
      title_fa: title.trim() || 'تجربه خرید عالی',
      comment: comment.trim(),
      comment_fa: comment.trim(),
      verified: true,
    })
    setName('')
    setTitle('')
    setComment('')
    pushToast({
      title: locale === 'fa' ? 'دیدگاه شما با موفقیت ثبت شد' : 'Review submitted!',
      type: 'success',
    })
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Submit Review Form */}
      <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-white/10 h-fit space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">
            {locale === 'fa' ? 'ثبت دیدگاه و امتیاز شما' : 'Share Your Experience'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              {locale === 'fa' ? 'امتیاز شما:' : 'Rating:'}
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= rating
                        ? 'text-amber-400 fill-current'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Input
            label={locale === 'fa' ? 'نام و نام خانوادگی' : 'Your Name'}
            placeholder={locale === 'fa' ? 'مثلاً: سهراب سپهری' : 'Alex Mercer'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label={locale === 'fa' ? 'عنوان دیدگاه' : 'Headline'}
            placeholder={locale === 'fa' ? 'کیفیت ساخت بی‌نظیر' : 'Incredible craftsmanship'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              {locale === 'fa' ? 'متن دیدگاه' : 'Review'}
            </label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                locale === 'fa'
                  ? 'تجربه کاربری خود را درباره طراحی و عملکرد این محصول بنویسید...'
                  : 'Tell others about the build quality, 3D finish, and performance...'
              }
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full">
            {locale === 'fa' ? 'ثبت دیدگاه تاییدشده' : 'Post Verified Review'}
          </Button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-white">
            {locale === 'fa' ? 'دیدگاه خریداران' : 'Collector Reviews'} (
            {formatNumber(product.rating_count, locale)})
          </h3>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-sm font-bold">
            <Star className="w-4 h-4 fill-current" />
            <span>{product.rating_avg.toFixed(1)} / 5.0</span>
          </div>
        </div>

        {product.reviews.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center text-slate-400 text-sm">
            {locale === 'fa'
              ? 'اولین نفری باشید که دیدگاه تخصصی خود را برای این پرچمدار ثبت می‌کند.'
              : 'Be the first collector to review this flagship edition.'}
          </div>
        ) : (
          <div className="space-y-3.5">
            {product.reviews.map((rev) => (
              <div
                key={rev.id}
                className="glass-panel rounded-2xl p-5 border border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                      {rev.user_name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{rev.user_name}</span>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            {locale === 'fa' ? 'خریدار تاییدشده' : 'Verified'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{rev.created_at}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-amber-200">
                  {locale === 'fa' ? rev.title_fa : rev.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {locale === 'fa' ? rev.comment_fa : rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
