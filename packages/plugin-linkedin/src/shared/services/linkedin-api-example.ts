import axios from 'axios';
import fs from 'fs/promises';
import { LinkedInUserInfoFetcher } from './LinkedInUserInfoFetcher';
import { LinkedInFileUploader } from './LinkedinFileUploader';
import { LinkedInPostPublisher } from './LinkedinPostPublisher';

const examplePost = '🚀 Sztuczna Inteligencja w służbie biznesu - moje przemyślenia po 6 miesiącach implementacji AI w firmie\n\n' +
                  'W ostatnim półroczu mieliśmy okazję wprowadzić szereg rozwiązań opartych o AI w naszej organizacji. Chciałbym podzielić się z Wami najważniejszymi wnioskami i obserwacjami.\n\n' +
                  '1. Automatyzacja procesów przyniosła nam 60% oszczędności czasu w dziale obsługi klienta. Nasz chatbot, wspomagany przez GPT-4, radzi sobie z 80% standardowych zapytań.\n\n' +
                  '2. Personalizacja komunikacji marketingowej z wykorzystaniem AI zwiększyła współczynnik konwersji o 45%. To pokazuje, jak ważne jest dostosowanie przekazu do indywidualnych potrzeb klienta.\n\n' +
                  '3. Największym wyzwaniem okazało się przeszkolenie zespołu i zmiana nawyków pracy. Inwestycja w edukację pracowników jest kluczowa dla sukcesu transformacji cyfrowej.\n\n' +
                  '💡 Co nas zaskoczyło? Pracownicy, którzy początkowo obawiali się AI, teraz są jej największymi zwolennikami. Technologia nie zastąpiła ludzi - dała im narzędzia do efektywniejszej pracy.\n\n' +
                  '🔗 Sprawdź projekt Eliza - autonomiczny agent AI: https://github.com/elizaOS/eliza\n\n' +
                  '#ArtificialIntelligence #Business #Innovation #DigitalTransformation #FutureOfWork';

(async () => {
  try {
    const accessToken = 'AQUn0WU...';
    const baseURL = 'https://api.linkedin.com/';

    const axiosInstance = axios.create({
        baseURL,
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });
    const userInfoFetcher = new LinkedInUserInfoFetcher(axiosInstance);
    const userInfo = await userInfoFetcher.getUserInfo();
    const fileUploader = new LinkedInFileUploader(axiosInstance, userInfo.sub);
    const file = await fs.readFile('./eliza.png');
    const imageBlob = new Blob([file], { type: 'image/png' });
    const imageId = await fileUploader.uploadAsset(imageBlob);
    const postPublisher = new LinkedInPostPublisher(axiosInstance, userInfo.sub);
    postPublisher.publishPost({
        postText: examplePost,
        media: {
          id: imageId,
          title: 'Eliza',
        },
    });
  } catch (error) {
    console.log(error);
  }
})();
