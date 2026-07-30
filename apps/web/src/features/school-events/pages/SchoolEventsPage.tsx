import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { cn } from "../../../lib/utils";
import { useSchoolKey } from "../../../lib/useSchoolKey";

type EventCategory =
  "Prova" | "Olimpíada" | "Vestibular" | "ENEM" | "Institucional";

type SchoolEvent = {
  id: string;
  title: string;
  category: EventCategory;
  start: Date;
  end?: Date;
  allDay?: boolean;
  location?: string;
  description?: string;
};

const categoryStyles: Record<EventCategory, { dot: string; event: string }> = {
  Prova: {
    dot: "bg-blue-500",
    event: "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  Olimpíada: {
    dot: "bg-violet-500",
    event:
      "border-violet-500 bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  Vestibular: {
    dot: "bg-orange-500",
    event:
      "border-orange-500 bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
  ENEM: {
    dot: "bg-rose-500",
    event: "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
  Institucional: {
    dot: "bg-emerald-500",
    event:
      "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const months = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function at(date: Date, hour: number, minute = 0) {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createInitialEvents(reference: Date): SchoolEvent[] {
  const sunday = startOfWeek(reference);
  return [
    {
      id: "1",
      title: "Semana de avaliações – 2º bimestre",
      category: "Prova",
      start: at(addDays(sunday, 1), 0),
      allDay: true,
    },
    {
      id: "2",
      title: "Inscrições OBA",
      category: "Olimpíada",
      start: at(addDays(sunday, 2), 0),
      allDay: true,
    },
    {
      id: "3",
      title: "Simulado ENEM",
      category: "ENEM",
      start: at(addDays(sunday, 3), 8),
      end: at(addDays(sunday, 3), 12),
      location: "Bloco B",
    },
    {
      id: "4",
      title: "Prova de Matemática",
      category: "Prova",
      start: at(addDays(sunday, 1), 9),
      end: at(addDays(sunday, 1), 10, 40),
      location: "Sala 12",
    },
    {
      id: "5",
      title: "Palestra: escolhas profissionais",
      category: "Vestibular",
      start: at(addDays(sunday, 4), 14),
      end: at(addDays(sunday, 4), 15, 30),
      location: "Auditório",
    },
    {
      id: "6",
      title: "Feira de ciências",
      category: "Institucional",
      start: at(addDays(sunday, 5), 13),
      end: at(addDays(sunday, 5), 17),
      location: "Pátio central",
    },
  ];
}

export function SchoolEventsPage() {
  const { payload } = useAuth();
  const { schoolKey, enabled } = useSchoolKey();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [eventsBySchool, setEventsBySchool] = useState<
    Record<string, SchoolEvent[]>
  >(() => ({}));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "Prova" as EventCategory,
    date: "",
    startTime: "08:00",
    endTime: "10:00",
    location: "",
    description: "",
    allDay: false,
  });
  const role = payload?.role;
  const canManage = role === "gestor" || role === "secretaria";
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const miniCalendarStart = startOfWeek(monthStart);
  const miniDays = Array.from({ length: 42 }, (_, index) =>
    addDays(miniCalendarStart, index),
  );
  const hours = Array.from({ length: 12 }, (_, index) => index + 7);
  const isTodayVisible = days.some((day) => sameDay(day, new Date()));
  const scopeName = role === "secretaria" ? "escola selecionada" : "sua escola";

  const scopeId = schoolKey ?? "unselected";
  const events = eventsBySchool[scopeId] ?? createInitialEvents(currentDate);
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events],
  );

  function moveWeek(amount: number) {
    setCurrentDate((date) => addDays(date, amount * 7));
  }

  function resetForm() {
    setForm({
      title: "",
      category: "Prova",
      date: "",
      startTime: "08:00",
      endTime: "10:00",
      location: "",
      description: "",
      allDay: false,
    });
  }

  function handleCreate() {
    if (!form.title || !form.date) return;
    const [year, month, day] = form.date.split("-").map(Number);
    const [startHour, startMinute] = form.startTime.split(":").map(Number);
    const [endHour, endMinute] = form.endTime.split(":").map(Number);
    const start = new Date(
      year,
      month - 1,
      day,
      form.allDay ? 0 : startHour,
      form.allDay ? 0 : startMinute,
    );
    const end = form.allDay
      ? undefined
      : new Date(year, month - 1, day, endHour, endMinute);
    setEventsBySchool((current) => ({
      ...current,
      [scopeId]: [
        ...(current[scopeId] ?? createInitialEvents(start)),
        {
          id: crypto.randomUUID(),
          title: form.title,
          category: form.category,
          start,
          end,
          allDay: form.allDay,
          location: form.location || undefined,
          description: form.description || undefined,
        },
      ],
    }));
    setCurrentDate(start);
    setIsDialogOpen(false);
    resetForm();
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Eventos escolares
            </h1>
            <p className="text-xs text-muted-foreground">
              Calendário exclusivo de {scopeName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Hoje
          </Button>
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => moveWeek(-1)}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => moveWeek(1)}
              aria-label="Próxima semana"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          {canManage && (
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              disabled={!enabled}
            >
              <CirclePlus className="size-4" /> Novo evento
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r p-4 lg:block">
          <div className="mb-5 flex items-center justify-between px-1">
            <button
              type="button"
              className="rounded p-1 hover:bg-muted"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1,
                  ),
                )
              }
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-medium capitalize">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              type="button"
              className="rounded p-1 hover:bg-muted"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1,
                  ),
                )
              }
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">
            {weekDays.map((day) => (
              <span key={day} className="py-1">
                {day.slice(0, 1)}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
            {miniDays.map((day) => {
              const inMonth = day.getMonth() === currentDate.getMonth();
              const active = sameDay(day, currentDate);
              const today = sameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setCurrentDate(day)}
                  className={cn(
                    "mx-auto flex size-7 items-center justify-center rounded-full transition-colors",
                    !inMonth && "text-muted-foreground/45",
                    active && "bg-primary text-primary-foreground",
                    !active && today && "bg-primary/10 text-primary",
                    !active && "hover:bg-muted",
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="my-6 border-t" />
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            TIPOS DE EVENTOS
          </p>
          <div className="space-y-3">
            {(Object.keys(categoryStyles) as EventCategory[]).map(
              (category) => (
                <div key={category} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      categoryStyles[category].dot,
                    )}
                  />
                  {category}
                </div>
              ),
            )}
          </div>
          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            Os eventos cadastrados por uma secretaria ficam visíveis somente
            para a escola selecionada.
          </p>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto">
          {!enabled ? (
            <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
              <CalendarDays className="size-10 text-muted-foreground" />
              <div>
                <h2 className="font-medium">Selecione uma escola</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escolha uma escola no topo da página para ver e cadastrar seus
                  eventos.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="sticky top-0 z-10 grid min-w-180 grid-cols-[64px_repeat(7,minmax(100px,1fr))] border-b bg-background">
                <div className="border-r p-2 text-right text-[10px] text-muted-foreground">
                  GMT-3
                </div>
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "border-r py-2 text-center last:border-r-0",
                      sameDay(day, new Date()) && "bg-primary/4",
                    )}
                  >
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {weekDays[day.getDay()]}
                    </p>
                    <p
                      className={cn(
                        "mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm",
                        sameDay(day, new Date()) &&
                          "bg-primary text-primary-foreground",
                      )}
                    >
                      {day.getDate()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid min-w-180 grid-cols-[64px_repeat(7,minmax(100px,1fr))] border-b bg-background">
                <div className="border-r px-2 py-2 text-right text-[10px] text-muted-foreground">
                  Dia todo
                </div>
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-12 border-r p-1 last:border-r-0",
                      sameDay(day, new Date()) && "bg-primary/4",
                    )}
                  >
                    {sortedEvents
                      .filter(
                        (event) => event.allDay && sameDay(event.start, day),
                      )
                      .map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          className={cn(
                            "mb-1 w-full truncate rounded border-l-2 px-1.5 py-1 text-left text-[11px] font-medium",
                            categoryStyles[event.category].event,
                          )}
                        >
                          {event.title}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
              <div
                className="relative grid min-w-180 grid-cols-[64px_repeat(7,minmax(100px,1fr))]"
                style={{ height: `${hours.length * 72}px` }}
              >
                <div className="col-start-1 row-start-1">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-18 border-r pr-2 pt-1 text-right text-[10px] text-muted-foreground"
                    >
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
                {days.map((day, index) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "relative border-r last:border-r-0",
                      sameDay(day, new Date()) && "bg-primary/4",
                    )}
                    style={{ gridColumnStart: index + 2 }}
                  >
                    {hours.map((hour) => (
                      <div key={hour} className="h-18 border-b" />
                    ))}
                    {sortedEvents
                      .filter(
                        (event) => !event.allDay && sameDay(event.start, day),
                      )
                      .map((event) => {
                        const startMinutes =
                          (event.start.getHours() - hours[0]) * 60 +
                          event.start.getMinutes();
                        const duration = event.end
                          ? Math.max(
                              30,
                              (event.end.getTime() - event.start.getTime()) /
                                60000,
                            )
                          : 60;
                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => setSelectedEvent(event)}
                            className={cn(
                              "absolute inset-x-1 overflow-hidden rounded border-l-2 px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm",
                              categoryStyles[event.category].event,
                            )}
                            style={{
                              top: `${(startMinutes / 60) * 72}px`,
                              height: `${Math.max(30, (duration / 60) * 72)}px`,
                            }}
                          >
                            <span className="block truncate font-semibold">
                              {event.title}
                            </span>
                            <span className="block truncate opacity-80">
                              {formatTime(event.start)}
                              {event.end ? ` – ${formatTime(event.end)}` : ""}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
              {!isTodayVisible && (
                <p className="p-3 text-center text-xs text-muted-foreground">
                  Navegue pelas semanas para consultar outros eventos.
                </p>
              )}
            </>
          )}
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo evento escolar</DialogTitle>
            <DialogDescription>
              O evento será associado somente à escola ativa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="event-title">Título</Label>
              <Input
                id="event-title"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="Ex.: Simulado ENEM"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="event-category">Tipo</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => {
                    if (value)
                      setForm({ ...form, category: value as EventCategory });
                  }}
                  items={(Object.keys(categoryStyles) as EventCategory[]).map(
                    (category) => ({ value: category, label: category }),
                  )}
                >
                  <SelectTrigger id="event-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(categoryStyles) as EventCategory[]).map(
                      (category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-date">Data</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({ ...form, date: event.target.value })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(event) =>
                  setForm({ ...form, allDay: event.target.checked })
                }
              />{" "}
              Evento de dia todo
            </label>
            {!form.allDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="event-start">Início</Label>
                  <Input
                    id="event-start"
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      setForm({ ...form, startTime: event.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-end">Fim</Label>
                  <Input
                    id="event-end"
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      setForm({ ...form, endTime: event.target.value })
                    }
                  />
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="event-location">Local (opcional)</Label>
              <Input
                id="event-location"
                value={form.location}
                onChange={(event) =>
                  setForm({ ...form, location: event.target.value })
                }
                placeholder="Ex.: Auditório"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-description">Descrição (opcional)</Label>
              <Textarea
                id="event-description"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.date}>
              Cadastrar evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>{selectedEvent.category}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  {selectedEvent.start.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </p>
                {!selectedEvent.allDay && (
                  <p className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    {formatTime(selectedEvent.start)}
                    {selectedEvent.end
                      ? ` – ${formatTime(selectedEvent.end)}`
                      : ""}
                  </p>
                )}
                {selectedEvent.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    {selectedEvent.location}
                  </p>
                )}
                {selectedEvent.description && (
                  <p className="text-muted-foreground">
                    {selectedEvent.description}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
