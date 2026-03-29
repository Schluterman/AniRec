import { motion } from 'framer-motion';
import { STREAMING_SERVICES } from '../types/anime';
import type { ActivePackId } from '../types/packs';
import { getPackArt } from '../data/packAssets';
import { StreamingIcon } from './StreamingIcons';
import './PackShop.css';

export interface PackShopProps {
  activePackId: ActivePackId;
  onSelectPack: (id: ActivePackId) => void;
  poolCountByPack: Record<ActivePackId, number>;
  currentPoolCount: number;
  /** When true, section is used inside bottom sheet (tighter spacing). */
  compact?: boolean;
}

const MASTER_LABEL = 'AniRec Pack';
const MASTER_SUB = 'All streaming sources';
const PLANNING_LABEL = 'Planning Pack';
const PLANNING_SUB = 'Matches on your Plan to Watch';

function PlanningPackIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

export function PackShop({
  activePackId,
  onSelectPack,
  compact = false,
}: Omit<PackShopProps, 'poolCountByPack' | 'currentPoolCount'> & Partial<Pick<PackShopProps, 'poolCountByPack' | 'currentPoolCount'>>) {
  return (
    <div className={`pack-shop ${compact ? 'pack-shop--compact' : ''}`}>
      <div className="pack-shop-header">
        <h3 className="pack-shop-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          Booster shop
        </h3>
        <p className="pack-shop-sub">Pick one pack — your pull pool updates instantly.</p>
      </div>

      <ul className="pack-shop-grid" role="list">
        <li>
          <PackSkuTile
            title={MASTER_LABEL}
            subtitle={MASTER_SUB}
            frontUrl={getPackArt('anirec').front}
            selected={activePackId === 'anirec'}
            onSelect={() => onSelectPack('anirec')}
            icon={null}
          />
        </li>
        <li>
          <PackSkuTile
            title={PLANNING_LABEL}
            subtitle={PLANNING_SUB}
            frontUrl={getPackArt('planning').front}
            selected={activePackId === 'planning'}
            onSelect={() => onSelectPack('planning')}
            icon={<PlanningPackIcon size={28} />}
          />
        </li>
        {STREAMING_SERVICES.map(service => (
          <li key={service.id}>
            <PackSkuTile
              title={`${service.name} Pack`}
              subtitle={`${service.name} catalog`}
              frontUrl={getPackArt(service.id).front}
              selected={activePackId === service.id}
              onSelect={() => onSelectPack(service.id)}
              icon={<StreamingIcon serviceId={service.id} size={28} />}
            />
          </li>
        ))}
      </ul>

      {activePackId !== 'anirec' && (
        <div className="pack-shop-footer">
          <button
            type="button"
            className="pack-shop-reset"
            onClick={() => onSelectPack('anirec')}
          >
            Use master pack
          </button>
        </div>
      )}
    </div>
  );
}

function PackSkuTile({
  title,
  subtitle,
  frontUrl,
  selected,
  onSelect,
  icon,
}: {
  title: string;
  subtitle: string;
  frontUrl: string;
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      className={`pack-sku ${selected ? 'pack-sku--selected' : ''}`}
      onClick={onSelect}
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-pressed={selected}
    >
      <span className="pack-sku-visual">
        <span
          className="pack-sku-thumb"
          style={{ backgroundImage: `url(${frontUrl})` }}
          role="img"
          aria-hidden
        />
        {icon && <span className="pack-sku-badge">{icon}</span>}
      </span>
      <span className="pack-sku-copy">
        <span className="pack-sku-title">{title}</span>
        <span className="pack-sku-sub">{subtitle}</span>
      </span>
    </motion.button>
  );
}
