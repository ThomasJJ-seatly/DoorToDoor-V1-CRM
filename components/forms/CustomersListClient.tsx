'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, ChevronRight, BookUser } from 'lucide-react'
import { formatCurrency, formatDate, formatPhone } from '@/lib/format'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Customer } from '@/types/database'

interface CustomersListClientProps {
  customers: Customer[]
  isAdmin: boolean
}

export function CustomersListClient({ customers, isAdmin }: CustomersListClientProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.business_name.toLowerCase().includes(q) ||
        (c.suburb ?? '').toLowerCase().includes(q) ||
        (c.contact_name ?? '').toLowerCase().includes(q)
    )
  }, [customers, search])

  const hasFilters = !!search.trim()

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Customers</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {filtered.length}{' '}
            {filtered.length === 1 ? 'customer' : 'customers'}
            {hasFilters && ' (filtered)'}
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent-light text-accent text-sm font-medium tabular-nums font-mono">
          {customers.length}
        </span>
      </div>

      {/* ── Search ── */}
      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            placeholder="Search by business name or suburb…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn w-7 h-7"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Empty states ── */}
      {customers.length === 0 ? (
        <EmptyState
          icon={<BookUser className="w-6 h-6" />}
          title="No customers yet"
          description="Customers are added automatically when you log a sale."
        />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-text-secondary text-sm">No customers match your search.</p>
          <button onClick={() => setSearch('')} className="secondary-btn mt-4 mx-auto">
            Clear search
          </button>
        </div>
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">
                      Business Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">
                      Suburb
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">
                      Contact
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">
                      Phone
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">
                      Total Spend
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">
                      Orders
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">
                      Last Sale
                    </th>
                    <th className="px-4 py-3" aria-label="View" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-bg-secondary/50 transition-colors group cursor-pointer"
                      onClick={() => {
                        window.location.href = `/customers/${customer.id}`
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-text-primary max-w-[200px] truncate">
                        {customer.business_name}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {customer.suburb ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary max-w-[150px] truncate">
                        {customer.contact_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {customer.phone ? (
                          <a
                            href={`tel:${customer.phone}`}
                            className="hover:text-accent transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {formatPhone(customer.phone)}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                        {formatCurrency(customer.total_spend)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">
                        {customer.total_orders}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {customer.last_sale_date
                          ? formatDate(customer.last_sale_date)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="icon-btn w-8 h-8 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`View ${customer.business_name}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="md:hidden space-y-2">
            {filtered.map((customer) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="card flex items-start gap-3 p-4 hover:bg-bg-secondary/50 transition-colors active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                  <BookUser className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-text-primary truncate">
                      {customer.business_name}
                    </span>
                    <span className="font-mono font-medium text-text-primary shrink-0 text-sm">
                      {formatCurrency(customer.total_spend)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {customer.suburb && (
                      <span className="text-xs text-text-secondary">{customer.suburb}</span>
                    )}
                    {customer.suburb && customer.last_sale_date && (
                      <span className="text-text-tertiary text-xs">·</span>
                    )}
                    {customer.last_sale_date && (
                      <span className="text-xs text-text-secondary">
                        Last: {formatDate(customer.last_sale_date)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-text-tertiary">
                      {customer.total_orders}{' '}
                      {customer.total_orders === 1 ? 'order' : 'orders'}
                    </span>
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-xs text-accent hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatPhone(customer.phone)}
                      </a>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
