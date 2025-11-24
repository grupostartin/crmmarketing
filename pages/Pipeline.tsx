import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
  useDroppable,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, DollarSign, User, Calendar, Trash2 } from 'lucide-react';
import PixelButton from '../components/ui/PixelButton';
import DealModal from '../components/DealModal';
import { supabase } from '../lib/supabase';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  contact: {
    name: string;
  } | null;
  created_at: string;
}

const STAGES = ['Novos Leads', 'Contatado', 'Qualificado', 'Proposta', 'Negociação', 'Fechado'];

const DealCard = ({ deal, onDelete }: { deal: Deal; onDelete: (dealId: string) => void; key?: React.Key }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0 : 1,
    scale: isDragging ? '0.95' : '1',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-retro-surface border-2 border-black p-4 shadow-pixel hover:border-retro-cyan hover:shadow-[6px_6px_0_0_#13ecc8] hover:scale-[1.02] group relative cursor-grab active:cursor-grabbing mb-2 transition-all duration-200 ${
        isDragging ? 'z-50' : 'z-0'
      }`}
    >
      <h3 className="font-header text-sm text-retro-fg mb-2">{deal.title}</h3>
      <div className="space-y-1">
        <p className="text-retro-comment text-xs flex items-center gap-1">
          <User size={12} /> {deal.contact?.name || 'Sem contato'}
        </p>
        <p className="text-retro-green text-xs flex items-center gap-1 font-bold">
          <DollarSign size={12} /> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}
        </p>
        <p className="text-retro-comment/60 text-[10px] flex items-center gap-1 pt-2 border-t border-black/20 mt-2">
          <Calendar size={10} /> {new Date(deal.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(deal.id);
        }}
        className="absolute top-2 right-2 p-1.5 hover:bg-retro-red hover:text-white border-2 border-black transition-colors opacity-0 group-hover:opacity-100 z-10"
        title="Deletar negócio"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const Pipeline = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contact:contacts(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals:', error);
        return;
      }

      if (data) {
        setDeals(data);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      setDeals(deals.filter(d => d.id !== dealId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting deal:', error);
      alert('Erro ao deletar negócio');
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    const deal = deals.find(d => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as string;

    // Check if dropped on a valid stage
    if (!STAGES.includes(newStage)) return;

    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    // Optimistic update
    setDeals(prevDeals =>
      prevDeals.map(d =>
        d.id === dealId ? { ...d, stage: newStage } : d
      )
    );

    // Persist to database
    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage })
        .eq('id', dealId);

      if (error) {
        console.error('Error updating deal:', error);
        alert(`Erro ao atualizar: ${error.message}`);
        // Revert on error
        await fetchDeals();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Erro inesperado ao atualizar o negócio');
      await fetchDeals();
    }
  };

  return (
    <div className="space-y-8 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-header text-3xl text-retro-fg">Pipeline de Vendas</h1>
          <p className="text-retro-comment text-lg">Gerencie seus negócios visualmente.</p>
        </div>
        <PixelButton variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" /> NOVO NEGÓCIO
        </PixelButton>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-6 gap-2 h-full min-w-0">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="flex flex-col bg-retro-bg/50 border-2 border-black/20 rounded-lg min-w-0"
            >
              <div className={`p-3 border-b-4 border-black mb-2 ${stage === 'Novos Leads' ? 'bg-retro-cyan/20 border-retro-cyan' :
                  stage === 'Contatado' ? 'bg-retro-purple/20 border-retro-purple' :
                    stage === 'Qualificado' ? 'bg-retro-pink/20 border-retro-pink' :
                      stage === 'Proposta' ? 'bg-retro-yellow/20 border-retro-yellow' :
                        stage === 'Negociação' ? 'bg-retro-orange/20 border-retro-orange' :
                          'bg-retro-green/20 border-retro-green'
                }`}>
                <div className="flex justify-between items-center gap-1">
                  <h3 className="font-header text-[10px] lg:text-xs uppercase truncate" title={stage}>{stage}</h3>
                  <span className="bg-black text-white text-[10px] px-1.5 py-0.5 font-bold shrink-0">
                    {deals.filter(d => d.stage === stage).length}
                  </span>
                </div>
              </div>

              <DroppableColumn id={stage}>
                <SortableContext
                  items={deals.filter(d => d.stage === stage).map(d => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex-1 p-2 overflow-y-auto min-h-[150px] scrollbar-thin">
                    {deals
                      .filter((deal) => deal.stage === stage)
                      .map((deal) => (
                        <DealCard 
                          key={deal.id} 
                          deal={deal} 
                          onDelete={setDeleteConfirm as (dealId: string) => void} 
                        />
                      ))}
                  </div>
                </SortableContext>
              </DroppableColumn>
            </div>
          ))}
        </div>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.4',
                },
              },
            }),
          }}
        >
          {activeDeal ? (
            <div className="bg-retro-surface border-4 border-retro-cyan p-4 shadow-[8px_8px_0_0_#13ecc8] rotate-3 scale-105 cursor-grabbing">
              <h3 className="font-header text-sm text-retro-fg mb-2">{activeDeal.title}</h3>
              <div className="space-y-1">
                <p className="text-retro-comment text-xs flex items-center gap-1">
                  <User size={12} /> {activeDeal.contact?.name || 'Sem contato'}
                </p>
                <p className="text-retro-green text-xs flex items-center gap-1 font-bold">
                  <DollarSign size={12} /> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeDeal.value)}
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDeals}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-retro-bg border-4 border-black p-8 shadow-pixel max-w-md mx-4">
            <h3 className="font-header text-xl text-retro-fg mb-4">Confirmar Exclusão</h3>
            <p className="text-retro-comment mb-6">
              Tem certeza que deseja deletar este negócio? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDeleteDeal(deleteConfirm)}
                className="flex-1 bg-retro-red hover:bg-retro-red/90 text-white font-bold py-2 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase"
              >
                Deletar
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-retro-surface hover:bg-retro-comment/20 text-retro-fg font-bold py-2 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to make the column droppable even when empty
const DroppableColumn = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex-1 transition-all duration-200 ${
        isOver ? 'bg-retro-cyan/10 ring-2 ring-retro-cyan ring-inset animate-pulse' : ''
      }`}
    >
      {children}
    </div>
  );
};

export default Pipeline;