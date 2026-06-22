import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jnspgpmdmouvkmoqaxlc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_KEY não informada.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const events = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    titulo: 'I Seminário Internacional sobre Extrema Direita',
    data: '2026-10-25',
    local: 'São Paulo, SP',
    descricao: 'Um debate abrangente com especialistas latino-americanos discutindo a ascensão e os impactos das narrativas de extrema direita. O seminário contará com palestras magnas, painéis de discussão e apresentação de trabalhos científicos.\n\n### Programação Prevista:\n- **09:00** - Abertura oficial e credenciamento\n- **10:00** - Painel 1: Teorias da Conspiração e Política Regional\n- **14:00** - Painel 2: Economia e Autoritarismo\n- **17:00** - Palestra de encerramento\n\nParticipe presencialmente ou assista à transmissão ao vivo pelo canal oficial do OEDLA no YouTube.',
    capa: '',
    imagens: []
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Mesa Redonda: Mídias Sociais e Populismo',
    data: '2026-11-12',
    local: 'Online',
    descricao: 'Análise das dinâmicas e algoritmos que facilitam a difusão de discursos populistas de extrema direita na América Latina. Nossos palestrantes debaterão o papel das grandes plataformas, a desinformação programática e os desafios regulatórios e democráticos.\n\n### Eixos Temáticos:\n1. Algoritmos de recomendação e radicalização\n2. Campanhas coordenadas de desinformação\n3. Regulação de plataformas sob perspectiva latino-americana',
    capa: '',
    imagens: []
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    titulo: 'Conferência Regional: Democracia e Resistência',
    data: '2026-12-05',
    local: 'Buenos Aires, Argentina',
    descricao: 'Mapeamento de iniciativas democráticas e estratégias de resistência frente ao avanço do autoritarismo regional. O evento reunirá ativistas, acadêmicos e formuladores de políticas públicas para construir pontes e propor soluções inovadoras.\n\nMais informações sobre as mesas redondas e chamadas para artigos acadêmicos serão divulgadas em breve.',
    capa: '',
    imagens: []
  }
];

async function seed() {
  console.log('🚀 Semeando eventos no Supabase...');
  for (const ev of events) {
    const { error } = await supabase
      .from('eventos')
      .upsert(ev, { onConflict: 'id' });
    if (error) {
      console.error(`❌ Erro ao inserir ${ev.titulo}:`, error.message);
    } else {
      console.log(`✅ Sucesso: ${ev.titulo}`);
    }
  }
}

seed();
