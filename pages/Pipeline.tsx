import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, DollarSign, User, Calendar } from 'lucide-react';
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
  };
  created_at: string;
}

const STAGES = ['Novos Leads', 'Contatado', 'Qualificado', 'Proposta', 'Negociação', 'Fechado'];

const SortableItem = ({ deal }: { deal: Deal }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { type: 'Deal', deal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-retro-surface border-2 border-retro-cyan p-4 shadow-pixel opacity-50 h-[120px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-retro-surface border-2 border-black p-4 shadow-pixel hover:border-retro-cyan cursor-grab active:cursor-grabbing group"
    >
      <h3 className="font-header text-sm text-retro-fg mb-2">{deal.title}</h3>
      <div className="space-y-1">
        <p className="text-retro-comment text-xs flex items-center gap-1">
          <User size={12} /> {deal.contact?.name}
        </p>
        <p className="text-retro-green text-xs flex items-center gap-1 font-bold">
          <DollarSign size={12} /> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}
        </p>
        <p className="text-retro-comment/60 text-[10px] flex items-center gap-1 pt-2 border-t border-black/20 mt-2">
          <Calendar size={10} /> {new Date(deal.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );
};

const Pipeline = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select(`
                *,
                contact:contacts(name)
            `)
      .order('created_at', { ascending: false });

    if (data) setDeals(data);
  };

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveDeal(active.data.current?.deal || null);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveADeal = active.data.current?.type === 'Deal';
    const isOverADeal = over.data.current?.type === 'Deal';

    if (!isActiveADeal) return;

    // Dropping a Deal over another Deal
    if (isActiveADeal && isOverADeal) {
      setDeals((deals) => {
        const activeIndex = deals.findIndex((t) => t.id === activeId);
        const overIndex = deals.findIndex((t) => t.id === overId);

        if (deals[activeIndex].stage !== deals[overIndex].stage) {
          deals[activeIndex].stage = deals[overIndex].stage;
          return arrayMove(deals, activeIndex, overIndex - 1);
        }

        return arrayMove(deals, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === 'Column';

    // Dropping a Deal over a Column
    if (isActiveADeal && isOverAColumn) {
      setDeals((deals) => {
        const activeIndex = deals.findIndex((t) => t.id === activeId);
        deals[activeIndex].stage = over.id as string;
        return arrayMove(deals, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    setActiveDeal(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeDeal = deals.find(d => d.id === activeId);
    const overColumn = STAGES.includes(overId) ? overId : null;
    const overDeal = deals.find(d => d.id === overId);

    let newStage = activeDeal?.stage;

    if (overColumn) {
      newStage = overColumn;
    } else if (overDeal) {
      newStage = overDeal.stage;
    }

    if (activeDeal && newStage && activeDeal.stage !== newStage) {
      // Optimistic update already happened in onDragOver for visual smoothness
      // Now persist to Supabase
      try {
        await supabase
          .from('deals')
          .update({ stage: newStage })
          .eq('id', activeId);
      } catch (error) {
        console.error('Error updating deal stage:', error);
        fetchDeals(); // Revert on error
      }
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
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
        onDragOver={onDragOver}
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

              <SortableContext
                id={stage}
                items={deals.filter(d => d.stage === stage).map(d => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px] scrollbar-thin"
                >
                  {/* We need a droppable ref for the column itself to handle empty states */}
                  <ColumnDroppable id={stage}>
                    {deals
                      .filter((deal) => deal.stage === stage)
                      .map((deal) => (
                        <SortableItem key={deal.id} deal={deal} />
                      ))}
                  </ColumnDroppable>
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeDeal ? (
            <div className="bg-retro-surface border-2 border-retro-cyan p-4 shadow-pixel rotate-3 cursor-grabbing w-[280px]">
              <h3 className="font-header text-sm text-retro-fg mb-2">{activeDeal.title}</h3>
              <div className="space-y-1">
                <p className="text-retro-comment text-xs flex items-center gap-1">
                  <User size={12} /> {activeDeal.contact?.name}
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
    </div>
  );
};

// Helper component to make the column droppable even when empty
import { useDroppable } from '@dnd-kit/core';

const ColumnDroppable = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({
    id: id,
    data: { type: 'Column' }
  });

  return (
    <div ref={setNodeRef} className="h-full min-h-[150px]">
      {children}
    </div>
  );
};

export default Pipeline;