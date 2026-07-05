import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list'
  className?: string
}

export default function ProductCard({ product, variant = 'grid', className }: ProductCardProps) {
  const discount = product.compare_price 
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  return (
    <div className={cn(
      'card group relative',
      variant === 'grid' ? 'p-4' : 'p-4 flex gap-6',
      className
    )}>
      {/* Wishlist Button */}
      <button className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors">
        <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
      </button>
      
      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
          {discount}% OFF
        </div>
      )}
      
      <Link href={`/product/${product.slug}`} className={cn(
        'flex',
        variant === 'grid' ? 'flex-col' : 'flex-row items-center'
      )}>
        {/* Image */}
        <div className={cn(
          'relative overflow-hidden rounded-lg bg-gray-100',
          variant === 'grid' ? 'w-full aspect-square' : 'w-48 h-48 flex-shrink-0'
        )}>
          {product.images && product.images[0] && (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>
        
        {/* Info */}
        <div className={cn(
          'flex-1',
          variant === 'grid' ? 'mt-3 space-y-1' : 'ml-4 space-y-2'
        )}>
          {/* Brand */}
          {product.brand && (
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {product.brand.name}
            </span>
          )}
          
          {/* Name */}
          <h3 className={cn(
            'font-medium text-gray-800 line-clamp-2',
            variant === 'grid' ? 'text-sm' : 'text-base'
          )}>
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{product.rating_avg?.toFixed(1) || '0'}</span>
            <span className="text-xs text-gray-400">({product.rating_count || 0})</span>
          </div>
          
          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.compare_price && (
              <span className="text-sm text-gray-400 line-through">
                ${product.compare_price.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          {product.stock_quantity > 0 ? (
            <span className="text-xs text-green-600">In Stock</span>
          ) : (
            <span className="text-xs text-red-500">Out of Stock</span>
          )}
        </div>
      </Link>
      
      {/* Add to Cart Button */}
      {product.stock_quantity > 0 && (
        <Button 
          variant="accent" 
          size="sm"
          className={cn(
            'w-full mt-3',
            variant === 'list' && 'mt-0'
          )}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      )}
    </div>
  )
}