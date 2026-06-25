import { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import ModelPerformanceChart from '@/components/ml/ModelPerformanceChart'
import FeatureImportanceBar from '@/components/ml/FeatureImportanceBar'
import { NeuralNetworkViz } from '@/components/dashboard/NeuralNetworkViz' // Reuse the existing one

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ML Engine | Aegis Route',
  description: 'Neural network visualizations and metrics',
}

export default async function MLEnginePage() {
  const admin = createAdminClient()
  
  // Fetch real model data if it existed in a real ml_models table
  // Here we'll simulate fetching the active model
  const activeModel = {
    name: 'AegisNet-v2.1',
    epochs: 150,
    accuracy: 0.982,
    precision: 0.975,
    recall: 0.989,
    f1: 0.982,
    lastTrained: new Date().toISOString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-grotesk">ML Engine</h1>
        <p className="text-white/50 text-sm mt-1">Deep neural network for automated threat classification.</p>
      </div>

      {/* Model Overview Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Model', value: activeModel.name },
          { label: 'Accuracy', value: `${(activeModel.accuracy * 100).toFixed(1)}%` },
          { label: 'Precision', value: `${(activeModel.precision * 100).toFixed(1)}%` },
          { label: 'Recall', value: `${(activeModel.recall * 100).toFixed(1)}%` },
        ].map(stat => (
          <div key={stat.label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 liquid-glass shadow-xl">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1 font-medium">{stat.label}</p>
            <p className="text-xl font-bold text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <ModelPerformanceChart />
          <FeatureImportanceBar />
        </div>
        <div className="flex flex-col gap-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 liquid-glass shadow-xl h-[400px]">
             <NeuralNetworkViz />
          </div>
        </div>
      </div>
    </div>
  )
}
