'use client'

import Link from 'next/link'
import { useVideoModal } from '@/context/video-modal-context'

export default function MarketplaceTeaserSection() {
  const { openModal } = useVideoModal()
  return (
    <div className="mkt" id="marketplace">
      <div className="mkti">
        <div className="ey">Construction marketplace</div>
        <h2 className="h2">Every trade. Every service. One platform.</h2>
        <p className="sub">Contractor network screened for licensing, insurance, and fit. Matched by trade, county, and capacity.</p>

        <div className="mkt-layout">
          {/* GC — tall */}
          <div className="mc tall" style={{ cursor: 'pointer' }} onClick={() => openModal({ tag: 'Most requested', title: 'General Contractor Marketplace', description: 'Every GC on Kealee is licensed in DC, MD, or VA — verified insurance and bonding on file. We match by trade, county, and current capacity. You review bids, select, and sign a contract through the platform.', thumbUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900&q=60&auto=format&fit=crop' })}>
            <div className="mci">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900&q=60&auto=format&fit=crop" alt="GC" />
            </div>
            <div className="mco" />
            <div className="mcplay"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="white" /></svg></div>
            <span className="mcc">150+ verified GCs</span>
            <div className="mcb"><div className="mctag">Most requested</div><h4>General contractors</h4><p>Residential, commercial, mixed-use · All DMV counties</p></div>
          </div>
          {/* Col 2 */}
          <div className="mkt-col">
            <div className="mc med">
              <div className="mci">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=60&auto=format&fit=crop" alt="Trades" />
              </div>
              <div className="mco" /><span className="mcc">All MEP</span>
              <div className="mcb"><div className="mctag">Licensed</div><h4>Specialty trades</h4><p>Electrical · Plumbing · HVAC · Structural</p></div>
            </div>
            <div className="mc med">
              <div className="mci">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&q=60&auto=format&fit=crop" alt="Landscape" />
              </div>
              <div className="mco" />
              <div className="mcb"><div className="mctag">Outdoor</div><h4>Landscape &amp; garden</h4><p>Design + install · Per service</p></div>
            </div>
          </div>
          {/* Col 3 */}
          <div className="mkt-col">
            <div className="mc med">
              <div className="mci">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=60&auto=format&fit=crop" alt="Estimation" />
              </div>
              <div className="mco" /><span className="mcc">Free AI estimate</span>
              <div className="mcb"><div className="mctag">RSMeans validated</div><h4>Cost estimation</h4><p>Free AI · $595 detailed · $1,850 certified</p></div>
            </div>
            <div className="mc med">
              <div className="mci">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=60&auto=format&fit=crop" alt="Support" />
              </div>
              <div className="mco" />
              <div className="mcb"><div className="mctag">Per service</div><h4>Project support</h4><p>Inspections · Pay apps · Lien waivers</p></div>
            </div>
          </div>
        </div>

        <div className="mkt-row2">
          <div className="mc sm"><div className="mci">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&q=60&auto=format&fit=crop" alt="Garden" /></div><div className="mco" /><div className="mcb"><div className="mctag">Design + install</div><h4>Garden design &amp; install</h4><p>Beds · Hardscape · Irrigation</p></div></div>
          <div className="mc sm"><div className="mci">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=500&q=60&auto=format&fit=crop" alt="Tiny home" /></div><div className="mco" /><div className="mcb"><div className="mctag">Concept + permits</div><h4>Tiny home builders</h4><p>Zoning · Design · Permits</p></div></div>
          <div className="mc sm"><div className="mci">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=60&auto=format&fit=crop" alt="Exterior" /></div><div className="mco" /><div className="mcb"><div className="mctag">Per service</div><h4>Exterior renovation</h4><p>Deck · Siding · Roofing · Fencing</p></div></div>
          <div className="mc sm"><div className="mci">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=500&q=60&auto=format&fit=crop" alt="Basement" /></div><div className="mco" /><div className="mcb"><div className="mctag">AI design ready</div><h4>Basement finish</h4><p>Concept · Egress check · Permits</p></div></div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/marketplace" className="btn bo blg">Browse full marketplace</Link>
        </div>
      </div>
    </div>
  )
}
