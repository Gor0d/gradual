"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEventFromOnboarding } from "@/lib/events/create-event-from-onboarding";

export function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [course, setCourse] = useState("");
  const [institution, setInstitution] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [goingInGroup, setGoingInGroup] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const { eventId } = await createEventFromOnboarding({
          course,
          institution,
          eventDate,
          city,
          state: state || undefined,
          estimatedBudget: estimatedBudget ? Number(estimatedBudget) : undefined,
        });

        router.push(`/eventos/${eventId}`);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível criar seu evento.");
      }
    });
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Vamos organizar sua colação de grau</CardTitle>
        <CardDescription>Só o essencial pra montar seu checklist e sua agenda de prazos.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Curso</Label>
              <Input id="course" required value={course} onChange={(event) => setCourse(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Instituição</Label>
              <Input
                id="institution"
                required
                value={institution}
                onChange={(event) => setInstitution(event.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date">Data da colação</Label>
              <Input
                id="event-date"
                type="date"
                required
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated-budget">Orçamento estimado (R$)</Label>
              <Input
                id="estimated-budget"
                type="number"
                min={0}
                step="0.01"
                value={estimatedBudget}
                onChange={(event) => setEstimatedBudget(event.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_5rem] gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" required value={city} onChange={(event) => setCity(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">UF</Label>
              <Input
                id="state"
                maxLength={2}
                value={state}
                onChange={(event) => setState(event.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="going-in-group"
              checked={goingInGroup}
              onCheckedChange={(checked) => setGoingInGroup(checked === true)}
            />
            <Label htmlFor="going-in-group" className="font-normal">
              Vou organizar com colegas de turma
            </Label>
          </div>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Criando seu checklist..." : "Criar meu checklist"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
