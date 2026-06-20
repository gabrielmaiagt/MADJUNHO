

export type Testimonial = {
    id: string;
    name: string;
    avatarUrl: string;
    rating: number;
    comment: string;
}

export type Product = {
    id: string;
    name: string;
    price: number;
    discount: number | null;
    rating: number;
    sold: number;
    images: string[];
    description: string;
    testimonials: Testimonial[];
    checkoutUrl: string;
};

// Esta variável 'products' é agora apenas um fallback ou para referência.
// Os dados principais são carregados do Firestore.
export const products: Product[] = [
    {
        id: "prod-6",
        name: "Guia de Massagem Tântrica (Vídeo-aula)",
        price: 69.90,
        discount: 30,
        rating: 5.0,
        sold: 891,
        images: [
            "https://i.postimg.cc/t4yCgqH8/tantric-massage.webp",
        ],
        description: "Eleve o prazer a um nível que ela nunca sentiu. Nesta vídeo-aula exclusiva, você aprenderá os segredos da massagem tântrica para despertar cada centímetro do corpo dela e criar uma conexão energética inesquecível. Domine toques, respiração e movimentos que transformam uma noite comum em uma experiência espiritual e intensamente erótica. Seja o homem que ela vai lembrar para sempre.",
        testimonials: [
            { id: "t17", name: "Fernando P.", avatarUrl: "https://randomuser.me/api/portraits/men/35.jpg", rating: 5, comment: "Isso não é uma massagem, é uma arte. A reação dela foi algo de outro mundo. Recomendo pra quem quer sair do básico." },
            { id: "t18", name: "Gustavo L.", avatarUrl: "https://randomuser.me/api/portraits/men/36.jpg", rating: 5, comment: "Comprei por curiosidade e me surpreendi. A didática é ótima e as técnicas são realmente poderosas." },
            { id: "t19", name: "Anônimo", avatarUrl: "https://i.postimg.cc/d1hDjyqJ/laura.webp", rating: 5, comment: "Mudou completamente a forma como eu enxergo a intimidade. É muito mais do que sexo." }
        ],
        checkoutUrl: "https://pay.madames.online/p/guia-tantrico"
    },
    {
        id: "prod-5",
        name: "Truque das Lésbicas",
        price: 49.90,
        discount: 45,
        rating: 5.0,
        sold: 1249,
        images: [
            "https://i.postimg.cc/rp17mjk4/45c4f1155b70ef9bebbd4180c6b20453-expressao-mordendo-os-labios.png",
        ],
        description: "Descubra, em uma videoaula explícita e prática, o truque que as lésbicas usam para deixar suas parceiras com as pernas tremendo — sem brinquedinhos. Uma técnica reveladora que garante orgasmos múltiplos e inesquecíveis, capaz de fazer qualquer mulher abandonar os homens e se render a quem realmente domina esse segredo sujo 😈\n\nSe torne o assunto mais comentado entre as mulheres e faça qualquer uma delas se viciar no seu sexo, implorando pra repetir cada momento de prazer 🔥\n\nObs.: se você for casado, não desbloqueie este produto! Sua esposa pode acabar espalhando pras amigas sobre seu desempenho na cama… e elas vão querer provar 🙈",
        testimonials: [
            { id: "t7", name: "Jonas B.", avatarUrl: "https://randomuser.me/api/portraits/men/25.jpg", rating: 5, comment: "Mudou o jogo pra mim. Incrível!" },
            { id: "t8", name: "Lucas P.", avatarUrl: "https://randomuser.me/api/portraits/men/26.jpg", rating: 5, comment: "Funciona mesmo. A reação dela foi impagável. Recomendo demais!" },
            { id: "t9", name: "Bruno V.", avatarUrl: "https://randomuser.me/api/portraits/men/27.jpg", rating: 5, comment: "Comprei sem muita fé, mas o resultado... surreal. Vale cada centavo." }
        ],
        checkoutUrl: "https://pay.madames.online/p/truque-lesbicas"
    },
    {
        id: "prod-2",
        name: "Videochamada comigo (até gozar)",
        price: 19.90,
        discount: 40,
        rating: 4.9,
        sold: 1532,
        images: [
            "https://i.postimg.cc/ZKTjfk5q/Design-sem-nome-3.png",
        ],
        description: "Uma videochamada só nossa… onde eu te guio em cada passo até você gozar 😈\nTudo ao vivo, privado e explícito — pra realizar cada uma das suas fantasias mais secretas, bem na sua frente 🔥",
        testimonials: [
            { id: "t3", name: "Ricardo F.", avatarUrl: "https://randomuser.me/api/portraits/men/22.jpg", rating: 5, comment: "Experiência surreal, valeu cada centavo! Ela é ainda mais incrível ao vivo e sabe exatamente o que dizer." },
            { id: "t10", name: "André L.", avatarUrl: "https://randomuser.me/api/portraits/men/28.jpg", rating: 5, comment: "Foi muito além do que eu esperava. Intenso e muito pessoal. Vou repetir com certeza." },
            { id: "t11", name: "J. Silva", avatarUrl: "https://i.postimg.cc/d1hDjyqJ/laura.webp", rating: 5, comment: "Se você está em dúvida, só vai. A conexão é real e a experiência é inesquecível." }
        ],
        checkoutUrl: "https://pay.madames.online/p/video-chamada"
    },
    {
        id: "prod-1",
        name: "Nome nos Peitos",
        price: 19.90,
        discount: 35,
        rating: 4.8,
        sold: 1844,
        images: [
            "https://i.postimg.cc/yd4CRpPL/image.png",
            "https://i.postimg.cc/HkgMSTL5/image.jpg",
            "https://i.postimg.cc/XvHYYpWq/shop-4.webp",
            "https://i.postimg.cc/W3R1gGk9/shop-5.webp",
        ],
        description: "Uma foto só sua… feita especialmente pra você 😈\nEnvie seu nome e receba uma imagem sensual com uma dedicatória escrita nos meus seios — um toque íntimo pra te deixar ainda mais perto de mim 💋",
        testimonials: [
            { id: "t1", name: "Carlos S.", avatarUrl: "https://randomuser.me/api/portraits/men/20.jpg", rating: 5, comment: "Recebi a foto com meu nome, que detalhe incrível! Me senti especial. Qualidade impecável." },
            { id: "t2", name: "Anônimo", avatarUrl: "https://i.postimg.cc/d1hDjyqJ/laura.webp", rating: 5, comment: "Adorei a personalização. Mostra um carinho e uma atenção que não se encontra em qualquer lugar." },
            { id: "t12", name: "Pedro H.", avatarUrl: "https://randomuser.me/api/portraits/men/30.jpg", rating: 5, comment: "Rápido, discreto e a foto ficou sensacional. Um presente criativo e muito sexy." }
        ],
        checkoutUrl: "https://pay.madames.online/p/foto-com-nome"
    },
    {
        id: "prod-4",
        name: "Nudes Exclusivos (15 fotos)",
        price: 14.90,
        discount: 30,
        rating: 4.9,
        sold: 1320,
        images: [
            "https://madames.online/wp-content/uploads/2025/03/luiza2.webp",
        ],
        description: "Um pack com 15 fotos exclusivas, escolhidas a dedo especialmente pra você 😈 \nCada clique exala pura tentação e desejo à flor da pele — pra te deixar sem fôlego 💦",
        testimonials: [
            { id: "t6", name: "Marcos T.", avatarUrl: "https://randomuser.me/api/portraits/men/24.jpg", rating: 5, comment: "As fotos são de muito bom gosto, superaram minhas expectativas. Sensualidade na medida certa." },
            { id: "t13", name: "Rafael M.", avatarUrl: "https://randomuser.me/api/portraits/men/31.jpg", rating: 5, comment: "Qualidade de imagem surreal. Cada foto é uma obra de arte. Comprarei mais packs." },
            { id: "t14", name: "Gilberto P.", avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg", rating: 5, comment: "Muito melhor do que eu imaginava. As poses são incríveis e a qualidade é profissional." }
        ],
        checkoutUrl: "https://pay.madames.online/p/nudes-exclusivos"
    },
    {
        id: "prod-3",
        name: "Áudio Gemendo (5 min)",
        price: 9.90,
        discount: 25,
        rating: 4.7,
        sold: 1987,
        images: [
            "https://i.postimg.cc/65ZVfmYk/46699889-voz-icone-som-volume-icone-audio-meios-de-comunicacao-jogador-simbolo-gratis-vetor.jpg",
        ],
        description: "Um áudio de 5 minutos com gemidos intensos e sussurros bem no seu ouvido 😈\nColoca os fones, fecha os olhos… e deixa sua imaginação te dominar por completo 😜",
        testimonials: [
            { id: "t5", name: "Sérgio R.", avatarUrl: "https://randomuser.me/api/portraits/men/23.jpg", rating: 5, comment: "A qualidade do som é impressionante. Me arrepiei do começo ao fim. Recomendo." },
            { id: "t15", name: "Renato G.", avatarUrl: "https://randomuser.me/api/portraits/men/33.jpg", rating: 5, comment: "Usei com fones e a experiência é muito imersiva. Parece que ela está no quarto." },
            { id: "t16", name: "Thiago R.", avatarUrl: "https://randomuser.me/api/portraits/men/34.jpg", rating: 5, comment: "Perfeito para relaxar a mente e... outras coisas. Os sussurros são o melhor." }
        ],
        checkoutUrl: "https://pay.madames.online/p/audio-gemendo"
    },
    {
        id: "prod-7",
        name: "Primeiro Encontro Inesquecível (Áudio-guia)",
        price: 29.90,
        discount: 50,
        rating: 4.9,
        sold: 753,
        images: [
            "https://i.postimg.cc/50DPyC03/first-date.webp",
        ],
        description: "A ansiedade do primeiro encontro acaba aqui. Este áudio-guia exclusivo é o seu mentor particular. Ouça no carro, antes de encontrá-la, e receba instruções passo a passo sobre como se portar, o que dizer e os gatilhos mentais para criar uma conexão instantânea e uma tensão sexual irresistível. Transforme o nervosismo em confiança e garanta que o primeiro encontro termine com um convite para o segundo.",
        testimonials: [
            { id: "t20", name: "Diego C.", avatarUrl: "https://randomuser.me/api/portraits/men/37.jpg", rating: 5, comment: "Ouvi no carro antes de buscar ela. Entrei no bar me sentindo o James Bond. A noite foi incrível." },
            { id: "t21", name: "Felipe A.", avatarUrl: "https://randomuser.me/api/portraits/men/38.jpg", rating: 5, comment: "As dicas sobre linguagem corporal e como conduzir a conversa são ouro puro. Funcionou 100%." },
            { id: "t22", name: "Vitor S.", avatarUrl: "https://randomuser.me/api/portraits/men/39.jpg", rating: 5, comment: "Eu era muito travado no primeiro encontro. Esse áudio me deu o roteiro que eu precisava. Top!" }
        ],
        checkoutUrl: "https://pay.madames.online/p/primeiro-encontro"
    }
];
