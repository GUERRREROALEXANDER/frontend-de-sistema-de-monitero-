import { motion } from 'motion/react';
import { RESOURCE_TARGETS, THRESHOLDS } from '../../config/services';
import { formatMb } from '../../utils/format';
import { RadialGauge } from '../ui/RadialGauge';
import { ServiceIcon } from '../ui/ServiceIcon';
import { fadeUp } from '../ui/motion';
import type { ResourceUsage } from '../../types/monitoring';

export function ResourceCards({ resources }: { resources: ResourceUsage[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {RESOURCE_TARGETS.map((target) => {
        const usage = resources.find((r) => r.target === target.id);
        const hot = usage !== undefined && (usage.cpuPercent > THRESHOLDS.cpuWarning || usage.memoryPercent > THRESHOLDS.memoryWarning);
        return (
          <motion.article
            key={target.id}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            className={`glass rounded-3xl p-5 ${hot ? 'ring-1 ring-danger-500/50' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span
                className="grid size-10 place-items-center rounded-2xl"
                style={{ backgroundColor: `${target.color}22`, color: target.color }}
              >
                <ServiceIcon kind={target.id} className="size-5" />
              </span>
              <div>
                <h3 className="font-bold">{target.label}</h3>
                <p className="text-muted text-xs">{usage ? 'Reporting' : 'No data'}</p>
              </div>
            </div>
            {usage ? (
              <div className="mt-5 flex justify-around">
                <RadialGauge value={usage.cpuPercent} label="CPU" warnAt={THRESHOLDS.cpuWarning - 15} criticalAt={THRESHOLDS.cpuWarning} />
                <RadialGauge
                  value={usage.memoryPercent}
                  label="Memory"
                  warnAt={THRESHOLDS.memoryWarning - 15}
                  criticalAt={THRESHOLDS.memoryWarning}
                  caption={
                    usage.memoryUsedMb !== null && usage.memoryTotalMb !== null
                      ? `${formatMb(usage.memoryUsedMb)} / ${formatMb(usage.memoryTotalMb)}`
                      : undefined
                  }
                />
              </div>
            ) : (
              <p className="text-muted mt-6 text-center text-sm">This component did not report usage.</p>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}
