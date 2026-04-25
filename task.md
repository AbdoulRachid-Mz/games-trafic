<!-- conditions ! -->
1: avant tou, on doit analyser pour mieux contextualiser et comprendre les logi    ques ;

2: en suite on cree pas si on peut ajuster, corriger, refactoriser les code existant: composents, libs, hooks, actions etc...

3: apres avoir compris les logi    ques, les ajustements, les corrections, les refactorisations possibles, on passe a la conception de la solution;

4: lors de la conception de la solution, il faut utiliser les meilleures pratiques de developpement;  

5: lors de l'implémentation de la solution, il faut respecter les normes de codage et les types correspondants generalement dans schema.ts et viewModel.ts si besoin; 

6: apres chaque implémentation, il faut revoir les logs et les logs d'erreur pour s'assure que tout est correct et les erreurs mises dans error-to-fixe.md;

7: a la fin on fait pnpm lint et pnpm tsc --noEmit pour verifie que tout est correct. 

8: pas de run build apres le check tsc;
    