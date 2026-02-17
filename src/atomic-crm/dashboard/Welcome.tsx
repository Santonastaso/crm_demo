import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Welcome = () => (
  <Card>
    <CardHeader className="px-4">
      <CardTitle>Industrie Edili Holding CRM</CardTitle>
    </CardHeader>
    <CardContent className="px-4">
      <p className="text-sm mb-4">
        Piattaforma integrata per la gestione commerciale di{" "}
        <a
          href="https://www.artediabitare.it/"
          className="underline hover:no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Arte di Abitare
        </a>
        {" "}e tutti i progetti immobiliari di{" "}
        <a
          href="https://www.industrieedili.it/web/default.asp?language=ita"
          className="underline hover:no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Industrie Edili Holding
        </a>
        .
      </p>
      <p className="text-sm mb-4">
        Gestisci contatti, pipeline commerciali, campagne marketing e comunicazioni
        con i lead da un unico punto di accesso. Il sistema include agenti AI per
        conversazioni automatiche, discovery di prospect e generazione contenuti.
      </p>
      <p className="text-sm">
        Utilizza il menu di navigazione per accedere a contatti, aziende, deal,
        progetti, unità immobiliari, segmenti, campagne e molto altro.
      </p>
    </CardContent>
  </Card>
);
