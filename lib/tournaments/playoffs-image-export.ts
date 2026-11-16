/**
 * Playoffs Image Export Engine
 * Games-Trafics Esports
 *
 * Moteur haute résolution (2400x1350) pour générer et exporter instantanément
 * une affiche de Playoffs au format PNG/JPEG pour les réseaux sociaux.
 */

import type { SymmetricalPlayoffTree, PlayoffMatchNode } from "@/lib/tournaments/playoffs-engine";

export interface ExportPlayoffsImageOptions {
  tree: SymmetricalPlayoffTree;
  tournamentName: string;
  editionName: string;
  game?: string;
  format?: "png" | "jpeg";
}

export async function exportPlayoffBracketImage({
  tree,
  tournamentName,
  editionName,
  game,
  format = "png",
}: ExportPlayoffsImageOptions): Promise<void> {
  const width = 2400;
  const height = 1350;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Impossible d'initialiser le contexte Canvas 2D.");
  }

  // 1. FOND D'ARÈNE ET AMBIANCE ESPORTS
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#070414");
  bgGradient.addColorStop(0.5, "#040510");
  bgGradient.addColorStop(1, "#030209");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Grille / maillage hexagonal
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1.5;
  const gridSize = 45;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Halos néon (Lueurs cyan à gauche, orange à droite, ambre au centre)
  const drawGlow = (gx: number, gy: number, radius: number, color: string) => {
    const radial = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
    radial.addColorStop(0, color);
    radial.addColorStop(1, "transparent");
    ctx.fillStyle = radial;
    ctx.fillRect(gx - radius, gy - radius, radius * 2, radius * 2);
  };

  drawGlow(400, 400, 500, "rgba(6, 182, 212, 0.12)");
  drawGlow(2000, 400, 500, "rgba(249, 115, 22, 0.12)");
  drawGlow(width / 2, height / 2 - 50, 450, "rgba(245, 158, 11, 0.15)");

  // 2. BANNIÈRE EN-TÊTE SUPÉRIEURE "THE PLAYOFFS"
  ctx.save();
  const bannerWidth = 860;
  const bannerHeight = 110;
  const bannerX = (width - bannerWidth) / 2;
  const bannerY = 50;

  // Bandeau trapézoïdal
  ctx.beginPath();
  ctx.moveTo(bannerX + 40, bannerY);
  ctx.lineTo(bannerX + bannerWidth - 40, bannerY);
  ctx.lineTo(bannerX + bannerWidth, bannerY + bannerHeight);
  ctx.lineTo(bannerX, bannerY + bannerHeight);
  ctx.closePath();

  const bannerGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerHeight);
  bannerGrad.addColorStop(0, "rgba(30, 20, 55, 0.95)");
  bannerGrad.addColorStop(1, "rgba(12, 10, 26, 0.98)");
  ctx.fillStyle = bannerGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Titres "THE PLAYOFFS"
  ctx.textAlign = "center";
  ctx.fillStyle = "#22d3ee";
  ctx.font = "900 18px sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("THE", width / 2, bannerY + 38);

  ctx.fillStyle = "#ffffff";
  ctx.font = "italic 900 52px sans-serif";
  ctx.shadowColor = "rgba(6, 182, 212, 0.7)";
  ctx.shadowBlur = 25;
  ctx.fillText("PLAYOFFS", width / 2, bannerY + 86);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Sous-titre officiel Tournoi & Édition
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "bold 20px sans-serif";
  ctx.letterSpacing = "2px";
  const gameTag = game ? `[${game.toUpperCase()}] • ` : "";
  ctx.fillText(`${gameTag}${tournamentName.toUpperCase()} — ${editionName.toUpperCase()}`, width / 2, 195);

  // 3. AILE GAUCHE (Cyan en haut, Orange en bas) & AILE DROITE
  const leftRounds = tree.leftWing.rounds;
  const rightRounds = tree.rightWing.rounds;
  const finalMatch = tree.center.finalMatch;

  const cardWidth = 260;
  const cardHeight = 76;
  const arenaTopY = 250;
  const arenaBottomY = 1180;
  const arenaAvailableHeight = arenaBottomY - arenaTopY;

  // Fonction pour dessiner une capsule de match biseautée
  const drawMatchCapsule = (
    x: number,
    y: number,
    match: PlayoffMatchNode,
    colorScheme: "cyan" | "orange"
  ) => {
    const isCyan = colorScheme === "cyan";

    // Conteneur de match
    ctx.save();
    ctx.fillStyle = isCyan ? "rgba(11, 20, 38, 0.95)" : "rgba(31, 16, 10, 0.95)";
    ctx.strokeStyle = isCyan ? "rgba(6, 182, 212, 0.4)" : "rgba(249, 115, 22, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, cardWidth, cardHeight, 12);
    ctx.fill();
    ctx.stroke();

    // Participant 1 (Moitié supérieure)
    const p1 = match.participant1;
    const p1Grad = ctx.createLinearGradient(x, y + 4, x + cardWidth, y + 4);
    if (isCyan) {
      p1Grad.addColorStop(0, "#0284c7");
      p1Grad.addColorStop(1, "#1d4ed8");
    } else {
      p1Grad.addColorStop(0, "#ea580c");
      p1Grad.addColorStop(1, "#c2410c");
    }

    ctx.fillStyle = p1Grad;
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 5, cardWidth - 10, 30, 6);
    ctx.fill();

    // Nom P1
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    const p1Label = p1.seed ? `#${p1.seed} ${p1.name}` : p1.name;
    ctx.fillText(p1Label.substring(0, 20), x + 14, y + 25);

    // Score P1
    if (p1.score !== null && p1.score !== undefined) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.beginPath();
      ctx.roundRect(x + cardWidth - 42, y + 8, 30, 22, 4);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(p1.score), x + cardWidth - 27, y + 24);
    }

    // Participant 2 (Moitié inférieure)
    const p2 = match.participant2;
    const p2Grad = ctx.createLinearGradient(x, y + 39, x + cardWidth, y + 39);
    if (isCyan) {
      p2Grad.addColorStop(0, "#0284c7");
      p2Grad.addColorStop(1, "#1d4ed8");
    } else {
      p2Grad.addColorStop(0, "#ea580c");
      p2Grad.addColorStop(1, "#c2410c");
    }

    ctx.fillStyle = p2Grad;
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 39, cardWidth - 10, 30, 6);
    ctx.fill();

    // Nom P2
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    const p2Label = p2.seed ? `#${p2.seed} ${p2.name}` : p2.name;
    ctx.fillText(p2Label.substring(0, 20), x + 14, y + 59);

    // Score P2
    if (p2.score !== null && p2.score !== undefined) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.beginPath();
      ctx.roundRect(x + cardWidth - 42, y + 42, 30, 22, 4);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(p2.score), x + cardWidth - 27, y + 58);
    }

    ctx.restore();
  };

  // Dessin des rounds de l'Aile Gauche
  const leftXPositions: number[] = [];
  const leftMatchesCenters: { x: number; y: number }[][] = [];

  leftRounds.forEach((round, rIdx) => {
    const rx = 100 + rIdx * 310;
    leftXPositions.push(rx);

    // Titre du round
    ctx.textAlign = "center";
    ctx.fillStyle = "#22d3ee";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(round.roundName.toUpperCase(), rx + cardWidth / 2, arenaTopY);

    const matchCount = round.matches.length;
    const spacing = arenaAvailableHeight / (matchCount + 1);
    const roundCenters: { x: number; y: number }[] = [];

    round.matches.forEach((m, mIdx) => {
      const my = arenaTopY + 30 + spacing * (mIdx + 0.5);
      const isUpper = mIdx < matchCount / 2;
      const colorScheme = isUpper ? "cyan" : "orange";
      drawMatchCapsule(rx, my, m, colorScheme);
      roundCenters.push({ x: rx + cardWidth, y: my + cardHeight / 2 });
    });

    leftMatchesCenters.push(roundCenters);
  });

  // Lignes de connexion de l'Aile Gauche
  for (let r = 0; r < leftMatchesCenters.length - 1; r++) {
    const current = leftMatchesCenters[r];
    const next = leftMatchesCenters[r + 1];

    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length && Math.floor(i / 2) < next.length) {
        const topNode = current[i];
        const bottomNode = current[i + 1];
        const targetNode = next[Math.floor(i / 2)];
        const midX = topNode.x + 25;

        ctx.strokeStyle = i < current.length / 2 ? "rgba(6, 182, 212, 0.4)" : "rgba(249, 115, 22, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topNode.x, topNode.y);
        ctx.lineTo(midX, topNode.y);
        ctx.lineTo(midX, bottomNode.y);
        ctx.lineTo(bottomNode.x, bottomNode.y);
        ctx.moveTo(midX, (topNode.y + bottomNode.y) / 2);
        ctx.lineTo(targetNode.x - cardWidth, targetNode.y);
        ctx.stroke();
      }
    }
  }

  // Dessin des rounds de l'Aile Droite (convergeant vers la gauche)
  const rightRoundsReversed = [...rightRounds].reverse();
  const rightXPositions: number[] = [];
  const rightMatchesCenters: { x: number; y: number }[][] = [];

  rightRoundsReversed.forEach((round, rIdx) => {
    const rx = width - 100 - cardWidth - (rightRoundsReversed.length - 1 - rIdx) * 310;
    rightXPositions.push(rx);

    // Titre du round
    ctx.textAlign = "center";
    ctx.fillStyle = "#fb923c";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(round.roundName.toUpperCase(), rx + cardWidth / 2, arenaTopY);

    const matchCount = round.matches.length;
    const spacing = arenaAvailableHeight / (matchCount + 1);
    const roundCenters: { x: number; y: number }[] = [];

    round.matches.forEach((m, mIdx) => {
      const my = arenaTopY + 30 + spacing * (mIdx + 0.5);
      const isUpper = mIdx < matchCount / 2;
      const colorScheme = isUpper ? "cyan" : "orange";
      drawMatchCapsule(rx, my, m, colorScheme);
      roundCenters.push({ x: rx, y: my + cardHeight / 2 });
    });

    rightMatchesCenters.push(roundCenters);
  });

  // 4. CENTRE : TROPHÉE D'OR & GRANDE FINALE
  const centerX = width / 2;
  const centerY = height / 2 + 30;

  // Trophée vectoriel éclatant
  ctx.save();
  ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
  ctx.shadowBlur = 30;

  // Socle du trophée
  ctx.fillStyle = "#d97706";
  ctx.fillRect(centerX - 35, centerY - 140, 70, 16);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(centerX - 25, centerY - 170, 50, 30);

  // Coupe
  ctx.beginPath();
  ctx.moveTo(centerX - 45, centerY - 230);
  ctx.lineTo(centerX + 45, centerY - 230);
  ctx.lineTo(centerX + 35, centerY - 180);
  ctx.quadraticCurveTo(centerX, centerY - 165, centerX - 35, centerY - 180);
  ctx.closePath();
  ctx.fillStyle = "#f59e0b";
  ctx.fill();

  // Anses
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(centerX - 48, centerY - 205, 18, 0.5 * Math.PI, 1.5 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX + 48, centerY - 205, 18, 1.5 * Math.PI, 0.5 * Math.PI);
  ctx.stroke();

  ctx.restore();

  // Label "FINAL"
  ctx.textAlign = "center";
  ctx.fillStyle = "#fbbf24";
  ctx.font = "900 24px sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("FINAL", centerX, centerY - 100);

  // Capsule de la Grande Finale
  if (finalMatch) {
    const finalCardWidth = 320;
    const finalCardHeight = 110;
    const fx = centerX - finalCardWidth / 2;
    const fy = centerY - 70;

    ctx.save();
    ctx.fillStyle = "rgba(20, 15, 30, 0.95)";
    ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(245, 158, 11, 0.5)";
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.roundRect(fx, fy, finalCardWidth, finalCardHeight, 16);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Participant 1 (Orange)
    const p1Grad = ctx.createLinearGradient(fx, fy, fx + finalCardWidth, fy);
    p1Grad.addColorStop(0, "#ea580c");
    p1Grad.addColorStop(1, "#c2410c");
    ctx.fillStyle = p1Grad;
    ctx.beginPath();
    ctx.roundRect(fx + 8, fy + 8, finalCardWidth - 16, 42, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(finalMatch.participant1.name, fx + 20, fy + 35);
    if (finalMatch.participant1.score !== null) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(fx + finalCardWidth - 55, fy + 14, 38, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(finalMatch.participant1.score), fx + finalCardWidth - 36, fy + 35);
    }

    // Participant 2 (Cyan)
    const p2Grad = ctx.createLinearGradient(fx, fy + 55, fx + finalCardWidth, fy + 55);
    p2Grad.addColorStop(0, "#0284c7");
    p2Grad.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = p2Grad;
    ctx.beginPath();
    ctx.roundRect(fx + 8, fy + 58, finalCardWidth - 16, 42, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(finalMatch.participant2.name, fx + 20, fy + 85);
    if (finalMatch.participant2.score !== null) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(fx + finalCardWidth - 55, fy + 64, 38, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(finalMatch.participant2.score), fx + finalCardWidth - 36, fy + 85);
    }

    ctx.restore();
  }

  // 5. FOOTER OFFICIEL
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "bold 14px sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("WORLD CHAMPIONSHIP • GAMES-TRAFICS ESPORTS PLATFORM", width / 2, height - 40);

  // Déclencher le téléchargement
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Échec de la génération de l'image Canvas."));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeName = `${tournamentName}-${editionName}`.toLowerCase().replace(/[^a-z0-9]/g, "-");
        a.href = url;
        a.download = `playoffs-${safeName}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      },
      format === "jpeg" ? "image/jpeg" : "image/png",
      0.95
    );
  });
}
