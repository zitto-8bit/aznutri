import React, { useState } from 'react';

const nutritionFacts = [
  "A maçã ajuda a manter o coração saudável.",
  "A banana é uma excelente fonte de potássio.",
  "O brócolis tem mais vitamina C do que a laranja.",
  "Beber água antes das refeições pode ajudar na digestão.",
  "Espinafre é rico em ferro e magnésio.",
  "Abacate contém gorduras saudáveis fundamentais para o cérebro.",
  "O consumo de fibras auxilia no controle da glicemia.",
  "Castanhas são ótimas fontes de selênio e vitamina E."
];

const NutritionMascot: React.FC = () => {
  const [fact, setFact] = useState<string | null>(null);

  const showRandomFact = () => {
    const randomIndex = Math.floor(Math.random() * nutritionFacts.length);
    setFact(nutritionFacts[randomIndex]);
  };

  return (
    <div 
      className="mascot-container" 
      onDoubleClick={showRandomFact}
      title="Clique 2x para uma curiosidade!"
    >
      <div className="mascot-image-wrapper">
        <img src="/mascot.png" alt="Mascote" className="mascot-image" />
      </div>
      <div className="mascot-bubble">
        <div className="mascot-welcome">Olá! Bem-vinda de volta.</div>
        {fact ? (
          <div className="mascot-fact"><b>Curiosidade:</b> {fact}</div>
        ) : (
          <div className="mascot-fact">Estou pronto para ajudar você hoje!</div>
        )}
        <div className="mascot-hint">(Clique 2x para uma dica de nutrição)</div>
      </div>
    </div>
  );
};

export default NutritionMascot;
