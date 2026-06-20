
import type { Match, GroupChat, GroupParticipant } from './types';

export const matches: Match[] = [
  { 
    id: '1', 
    name: 'Laura', 
    avatarUrl: 'https://picsum.photos/seed/laura/200', 
    dataAiHint: 'woman smiling', 
    lastMessage: 'Haha, você parece divertido!', 
    isNew: true, 
    conversation: [
        "Haha, você parece divertido!",
        "Adorei sua energia! But me diz, o que você busca por aqui, algo sério ou só umas risadas?",
        "Entendi... Gosto de gente decidida. Eu também sei o que quero, e geralmente consigo.",
        "Sabe, o papo tá ótimo, mas sinto que pra gente realmente se conectar, precisaríamos de algo a mais.",
        "No meu perfil exclusivo do Madames Online VIP tem umas coisas que podem te interessar... Se você for ousado o suficiente pra ver, claro.",
    ]
  },
  { 
    id: '2', 
    name: 'Beatriz', 
    avatarUrl: 'https://picsum.photos/seed/beatriz/200', 
    dataAiHint: 'woman serious', 
    lastMessage: 'Que ótimo! O que você gosta de fazer?', 
    isNew: false, 
    conversation: [
        "Que ótimo! O que você gosta de fazer no seu tempo livre?",
        "Interessante. Eu sou mais de ficar em casa, um bom vinho, uma conversa que flui...",
        "Acho que a gente combina nisso, então. Gosto de quem sabe apreciar os detalhes.",
        "Mas sinto que conversar por aqui limita muito... a gente só vê a ponta do iceberg, sabe?",
        "Para os membros Ouro, eu liberei umas fotos e uns áudios que mostram um lado meu que quase ninguém conhece. Fica a dica.",
    ]
  },
  { 
    id: '3', 
    name: 'Camila', 
    avatarUrl: 'https://picsum.photos/seed/camila/200', 
    dataAiHint: 'woman looking away', 
    lastMessage: 'Te achei super interessante :)', 
    isNew: true, 
    conversation: [
        "Te achei super interessante :)",
        "Você tem um olhar que diz muita coisa... mas não tudo. Gosto de mistério.",
        "Haha, un pouco de mistério é sempre bom. Mantém as coisas excitantes, não acha?",
        "Falando em excitação, essa conversa tá me deixando curiosa.",
        "Sabe que no plano Ouro a gente pode trocar mensagens de vídeo? Acho que você ia gostar de ver minha reação de verdade.",
    ]
  },
  { 
    id: '4', 
    name: 'Juliana', 
    avatarUrl: 'https://picsum.photos/seed/juliana/200', 
    dataAiHint: 'woman nature', 
    lastMessage: 'Sério? Eu também!', 
    isNew: false, 
    conversation: [
        "Sério? Não acredito que you também curte isso! Que coincidência boa.",
        "A gente podia combinar de fazer isso juntos um dia... o que acha?",
        "Perfeito! Mas antes, preciso saber se você é do tipo que topa um desafio.",
        "Aqui no app tem uns minigames exclusivos pra membros Ouro que testam a sintonia do casal. Se a gente ganhar, o primeiro encontro é por minha conta. Topa o desafio?",
    ]
  },
  { 
    id: '5', 
    name: 'Fernanda', 
    avatarUrl: 'https://picsum.photos/seed/fernanda/200', 
    dataAiHint: 'woman city', 
    lastMessage: 'Adorei sua bio!', 
    isNew: false, conversation: [
        "Adorei sua bio! Direta e com um toque de humor.",
        "Mostra que você não tá pra brincadeira. Eu também sou assim.",
        "Otimizar o tempo é tudo, né? Odeio papo furado.",
        "É por isso que eu só continuo a conversa com quem tem o selo Ouro. É um filtro, sabe? Mostra quem tá realmente investido em encontrar algo que vale a pena.",
        "Se você fizer o upgrade, me manda uma mensagem. Quero ver se você é tão decidido quanto parece.",
    ]
  },
];

const groupParticipants: GroupParticipant[] = [
    { id: '1', name: 'Amanda', avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/mentoros-app.firebasestorage.app/o/media-hub%2FMAbrOVJfktZcWonkiLv4OS8eDc12%2F1781993386231-profile-amanda.png?alt=media&token=8a5a6068-7d9c-4a41-b95d-a4d62a23e656', dataAiHint: 'woman smiling' },
    { id: '2', name: 'Vanessa', avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/mentoros-app.firebasestorage.app/o/media-hub%2FMAbrOVJfktZcWonkiLv4OS8eDc12%2F1781993224509-4a67e130ab33672528eba4ce4e0df5ec.jpg?alt=media&token=0e37a2da-2a35-46ff-9cc6-7dc0fe32718a', dataAiHint: 'woman serious' },
    { id: '4', name: 'Luiza', avatarUrl: 'https://i.postimg.cc/xTCDJW9H/profile-luiza.webp', dataAiHint: 'woman nature' },
    { id: '5', name: 'Renata', avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/mentoros-app.firebasestorage.app/o/media-hub%2FMAbrOVJfktZcWonkiLv4OS8eDc12%2F1781993392633-profile-renata.webp?alt=media&token=aa777513-4a49-4771-b015-1c03efe6941d', dataAiHint: 'woman looking away' },
];

const luizaVideoHtml = `
  <style>body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: black; } video { width: 100%; height: 100%; object-fit: cover; }</style>
  <video src="https://madames.online/wp-content/uploads/2025/08/sss.mp4" autoplay muted playsinline loop></video>
`;


export const groupChat: GroupChat = {
    id: 'group-1',
    name: 'Clube das Madames',
    participants: groupParticipants,
    lastMessage: 'Olha, meninas… entrou um novinho no grupo 👀',
    isNew: true,
    lastMessageTimestamp: 'Agora',
    conversation: [
        { id: 'g-msg-1', text: 'Olha, meninas… entrou um novinho no grupo 👀', sender: { id: '1', name: 'Amanda' }},
        { id: 'g-msg-2', text: 'Eu vi 😏 será que ele curte uma putaria também? 🙈', sender: { id: '5', name: 'Renata' }},
        { id: 'g-msg-4a', text: 'Ele parece ter potencial... vou mandar um mimo pra ele 🎁', sender: { id: '1', name: 'Amanda' }},
        { id: 'g-msg-4b', text: 'Toma, novinho, um PIX pra começar bem 💲', sender: { id: '1', name: 'Amanda' }},
        { id: 'g-msg-6', text: 'Já que é pra causar, vou mostrar como se faz…', sender: { id: '4', name: 'Luiza' }},
        { id: 'g-msg-7', iframeSrc: `data:text/html;charset=utf-8,${encodeURIComponent(luizaVideoHtml)}`, sender: { id: '4', name: 'Luiza' }},
        { id: 'g-msg-8', text: 'Ui, Luiza 😳 imagina esse gemido bem no seu ouvido, novinho…', sender: { id: '1', name: 'Amanda' }},
        { id: 'g-msg-9', text: 'Conta pra gente… quem você achou mais safada? 😈', sender: { id: '1', name: 'Amanda' }},
        { id: 'g-msg-10', text: 'Acho que ele ainda não pode responder, amiga 😢', sender: { id: '4', name: 'Luiza' }},
        { id: 'g-msg-11', text: 'Sem o acesso completo, não consegue ver todas as nossas mídias nem participar das conversas privadas…', sender: { id: '4', name: 'Luiza' }},
        { id: 'g-msg-12', text: 'Hmm, que pena 😔', sender: { id: '1', name: 'Amanda' }},
        { id: 'g-msg-13', text: 'Mas se ele desbloquear agora, vai poder responder e ver tudo sem censura 🔥', sender: { id: '1', name: 'Amanda' }},
        { id: 'g-msg-14', text: 'E ainda vai receber convites exclusivos pra se divertir com a gente 👅', sender: { id: '1', name: 'Amanda' }},
        { id: 'g-msg-15', text: 'Só tem 10 minutinhos pra aproveitar essa oportunidade 🚨', sender: { id: '5', name: 'Renata' }},
        { id: 'g-msg-16', text: 'Então, não perde tempo, novinho ⌛', sender: { id: '5', name: 'Renata' }},
        { id: 'g-msg-17', text: 'Toca no botão abaixo e entra de cabeça no Clube das Madames 😈', sender: { id: '5', name: 'Renata' }},
    ]
};

type ConversationStep = {
    type: 'madame' | 'user_prompt' | 'reward' | 'offer' | 'product_selection' | 'incentive';
    text?: string;
    amount?: number;
};

type LockedChat = {
    id: string;
    name: string;
    avatarUrl: string;
    lastMessage: string;
    timestamp: string;
    productId: string;
    conversation: ConversationStep[];
};


export const lockedChats: LockedChat[] = [
    {
        id: 'locked-3',
        name: 'Renata',
        avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/mentoros-app.firebasestorage.app/o/media-hub%2FMAbrOVJfktZcWonkiLv4OS8eDc12%2F1781993252275-fb2ee6a1a54190c6a38eb9de11083e6c.jpg?alt=media&token=5b9c400c-ca6c-4912-a4fb-d9118c6812ee',
        lastMessage: 'E aí, novinho... tem coragem?',
        timestamp: '21:44',
        productId: 'prod-3', // Áudio Gemendo
        conversation: [
            { type: 'madame', text: 'Boa noitee, amor! Fiquei feliz que desbloqueou nossa conversa 😍' },
            { type: 'madame', text: 'Me conta… o que achou da live? 😏' },
            { type: 'user_prompt' },
            { type: 'madame', text: 'Que bom, vida 😊' },
            { type: 'madame', text: 'Quero que seja sincero… você daria conta de mim na cama? 😈' },
            { type: 'user_prompt' },
            { type: 'madame', text: 'Uii… assim fico toda molhada, seu safado 💦' },
            { type: 'madame', text: 'Agora tenho certeza que vale a pena investir em você 💸' },
            { type: 'madame', text: 'Vou te mandar um mimo pra apimentar nossa relação 🌶️' },
            { type: 'reward', amount: 50 },
            { type: 'product_selection' },
            { type: 'incentive', text: 'Ah… e só pra deixar claro: quanto mais produtos adquirir, mais mimos vai ganhar 🤩' }
        ],
    },
    {
        id: 'locked-4',
        name: 'Vanessa',
        avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/mentoros-app.firebasestorage.app/o/media-hub%2FMAbrOVJfktZcWonkiLv4OS8eDc12%2F1781993224509-4a67e130ab33672528eba4ce4e0df5ec.jpg?alt=media&token=0e37a2da-2a35-46ff-9cc6-7dc0fe32718a',
        lastMessage: 'Oi, lindo. Que bom te ver aqui.',
        timestamp: '21:43',
        productId: 'prod-5', // Truque das Lésbicas
        conversation: [
            { type: 'madame', text: 'Oiee, vida! Que bom te ver por aqui 😍' },
            { type: 'madame', text: 'Me fala… curtiu a live? 😈' },
            { type: 'user_prompt' },
            { type: 'madame', text: 'Fico feliz que tenha gostado, amor 😊' },
            { type: 'madame', text: 'Seja sincero comigo… você me aguentaria na cama? 😏' },
            { type: 'user_prompt' },
            { type: 'madame', text: 'Nossa… desse jeito fico cheia de tesão 🔥' },
            { type: 'madame', text: 'Agora não tenho dúvidas que você merece meu investimento 💲' },
            { type: 'madame', text: 'Vou te mandar um presentinho pra esquentar ainda mais as coisas 🎁' },
            { type: 'reward', amount: 40 },
            { type: 'product_selection' },
            { type: 'incentive', text: 'Fica a dica: quanto mais produtos levar, mais presentes te esperam 😜' }
        ],
    },
    {
        id: 'locked-2',
        name: 'Luiza',
        avatarUrl: 'https://i.postimg.cc/xTCDJW9H/profile-luiza.webp',
        lastMessage: 'Finalmente a sós...',
        timestamp: '21:42',
        productId: 'prod-4', // Nudes Exclusivos
        conversation: [
            { type: 'madame', text: 'Oii, amor! Adorei que veio conversar comigo 😍' },
            { type: 'madame', text: 'Me diz… gostou da live? 😏' },
            { type: 'user_prompt' },
            { type: 'madame', text: 'Assim você me deixa ainda mais animada, vida 😊' },
            { type: 'madame', text: 'Entre nós… você conseguiria me fazer chegar lá? 💦' },
            { type: 'user_prompt' },
            { type: 'madame', text: 'Aff… desse jeito não consigo me segurar 😈' },
            { type: 'madame', text: 'Agora sei que vale a pena apostar em você 💰' },
            { type: 'madame', text: 'Vou te mandar um agrado que vai elevar a temperatura entre a gente 🔥' },
            { type: 'reward', amount: 45 },
            { type: 'product_selection' },
            { type: 'incentive', text: 'Ah… e só pra você saber: quanto mais itens escolher, mais agrados vai receber 🎁' }
        ],
    },
    {
        id: 'locked-1',
        name: 'Amanda',
        avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/mentoros-app.firebasestorage.app/o/media-hub%2FMAbrOVJfktZcWonkiLv4OS8eDc12%2F1781993386231-profile-amanda.png?alt=media&token=8a5a6068-7d9c-4a41-b95d-a4d62a23e656',
        lastMessage: 'Gostei de você... quero te conhecer melhor.',
        timestamp: '21:45',
        productId: 'prod-2', // Videochamada
        conversation: [
            { type: 'madame', text: 'Boa noite, vida! Sabia que não ia me decepcionar 😍' },
            { type: 'madame', text: 'Quero saber… a live te prendeu do início ao fim? 😏' },
            { type: 'user_prompt' },
            { type: 'madame', text: 'Imaginei 😜' },
            { type: 'madame', text: 'Diz a real… você aguentaria meu ritmo? 💦' },
            { type: 'user_prompt' },
            { type: 'madame', text: 'Socorro… a cada resposta sua fico mais excitada 🔥' },
            { type: 'madame', text: 'Agora ficou claro que você merece todo meu esforço 💸' },
            { type: 'madame', text: 'Vou te presentear com algo que vai esquentar ainda mais o clima entre nós 🎁' },
            { type: 'reward', amount: 60 },
            { type: 'product_selection' },
            { type: 'incentive', text: 'Atenção: quanto mais produtos garantir, mais presentes vou te mandar 💖' }
        ],
    }
];
