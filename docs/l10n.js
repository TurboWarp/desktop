window.L = (function () {
  const allLanguageMessages = /*===*/{"de":{"alternative":"Alternative Downloads für andere Architekturen:","appimage.download":"App herunterladen. ({arch})","appimage.header":"TurboWar Desktop mit AppImage installieren.","appimage.step2":"Als Ausführbar markieren. ({chmod_x_AppImage} oder eine Checkbox in rechte Maustaste > Eigenschaften > Berechtigungen)","appimage.step3":"Führe die .Appimage aus","bugs":"Fehler solltenauf {on_GitHub} oder {on_Scratch} gemeldet werden.","bugs.on_GitHub":"auf GitHub","bugs.on_Scratch":"auf Scratch","debian.download":"Paket herunterladen. ({arch})","debian.header":"TurboWarp Desktop für Debian und Ubuntu installieren","debian.step2":"Installiere die .deb-Datei mit {apt_install} oder mit dem App Store deiner Distribution.","faq.privacy.answer":"Bitte lies die {very_short_privacy_policy} durch.","faq.privacy.answer.very_short_privacy_policy":"sehr kurze Datenschutzerklärung","faq.privacy.header":"Datenschutzerklärung","faq.source.answer":"TurboWarps Quellcode ist {on_GitHub}. TurboWarp ist unter der GNU General Public License v3.0 lizensiert.","faq.source.answer.on_GitHub":"auf GitHub","faq.source.header":"Quellcode","faq.speed.answer":"Normalerweise nicht, aber es ist möglicherweise stabiler, da Ihr Computer es nicht entlädt, um Speicherplatz zu sparen.","faq.speed.header":"Ist TurboWarp Desktop schneller als das normale TurboWarp?","faq.update.answer":"Die App wird manchmal nach Updates suchen und dich benachrichtigen, wenn eines Verfügbar ist. Um es zu aktualisieren, lade den neuen Installer herunter und starte ihn erneut.","faq.update.header":"Wie aktualisiere ich es?","header.affiliation":"TurboWarp ist nicht mit Scratch, dem Scratch Team oder der Scratch-Stiftung verbunden.","mac.header":"TurboWarp Desktop für macOS installieren","mac.step1":"Installer herunterladen.","mac.step2":"Öffne die .dmg-Datei. Verschiebe TurboWarp Desktop in Applications.","mac.step3":"Unsere Binärdateien sind {not_notarized}, deshalb werden Extraschritte benötigt. Öffne den Finder, navigiere zu Applications, klicke TurboWarp Desktop mit der rechten Maustaste an und wähle \"Öffnen\" und dann wieder \"Öffnen\" aus.","mac.step3.not_notarized":"nicht notarisiert","picture.caption":"Angezeigtes Projekt: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer von piano_miles","picture.title":"Angezeigtes Projekt: Full Sphere Path Tracer von piano_miles","select":"Wähle dein OS aus:","snap.description":"TurboWarp ist im Snap-Store mit dem Namen {turbowarpdesktop} veröffentlicht. Aktuell ist nur x86 64-Bit unterstützt. Manche Scratch-Features (Mikrofon, Kamera, Bluetooth) könnten manuelle Verbindungen benötigen.","snap.header":"TurboWarp Desktop mit Snap installieren","snap.step1":"Snapd installieren.","unknown":"Paket für deine Sysemarchitektur herunterladen:","windows.download":"Installer herunterladen.","windows.header":"TurboWarp Desktop für Windows installieren","windows.run":".exe-Datei ausführen.","windows.smartscreen":"Falls eine Warnung von Windows SmartScreen erscheint, klicke auf \"Weitere Informationen\" und dann auf \"Trotzdem ausführen\""},"es":{"alternative":"Descargas alternativas para otras arquitecturas:","appimage.download":"Descargar app. ({arch})","appimage.header":"Instalar TurboWarp desktop con AppImage","appimage.step2":"Marcar como ejecutable ({chmod_x_AppImage} o un checkbox en click derecho > propiedades > permisos)","appimage.step3":"Ejecute el archivo .AppImage","bugs":"Reporte errores en {on_GitHub} o {on_Scratch}.","bugs.on_GitHub":"en GitHub","bugs.on_Scratch":"en Scratch","debian.download":"Descargar paquete. ({arch})","debian.header":"Instalar TurboWarp Desktop para Debian y Ubuntu","debian.step2":"Instale el archivo .deb con {apt_install} o con la app store de su distribución.","faq.privacy.answer":"Por favor lea la {very_short_privacy_policy}.","faq.privacy.answer.very_short_privacy_policy":"política de privacidad muy corta","faq.privacy.header":"Política de privacidad","faq.source.answer":"El código fuente de TurboWarp está {on_GitHub}. TurboWarp Desktop está licenciado con GNU General Public License v3.0.","faq.source.answer.on_GitHub":"en GitHub","faq.source.header":"Código fuente","faq.speed.answer":"Usualmente no, pero podría llegar a ser más estable ya que su computadora no lo quitará de la memoria si está llena.","faq.speed.header":"¿Es TurboWarp Desktop más rápido que TurboWarp normal?","faq.update.answer":"La app periódicamente revisa si hay actualizaciones y le notifica cuando hay una disponible. Para actualizar, descargue el nuevo instalador y ejecútelo","faq.update.header":"¿Cómo lo actualizo?","header.affiliation":"TurboWarp no está afiliado con Scratch, el equipo de Scratch o la Scratch Foundation.","header.subtitle":"Use {TurboWarp}, el mod de Scratch con compilador, modo oscuro, addons y más, desde una app en su escritorio. Funciona incluso sin una conexión a internet.","mac.header":"Instalar TurboWarp Desktop para macOS","mac.step1":"Descargue el instalador.","mac.step2":"Abra el archivo .dmg. Mueva TurboWarp Desktop a \"Aplicaciones\".","mac.step3":"Nuestros archivos binarios {not_notarized}, por lo que se podrían necesitar pasos adicionales. Abra Finder, navegue a \"Aplicaciones\", haga click derecho en TurboWarp Desktop y seleccione \"Abrir\" y después \"Abrir\" de nuevo.","mac.step3.not_notarized":"no están firmados","picture.caption":"Proyecto en la imagen: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer por ano_miles","picture.title":"Proyecto en la imagen: Full Sphere Path Tracer por piano_miles","select":"Elija su sistema operativo:","snap.description":"TurboWarp está publicado en el Snap Store con el nombre {turbowarpdesktop}. Actualmente solo x86 64-bit es soportado. Algunas funciones de Scratch (micrófono, cámara y bluetooth) pueden requerir conexiones manuales.","snap.header":"Instalar TurboWarp Desktop con Snap","snap.step1":"Instale snapd.","unknown":"Descargue el paquete para la arquitectura de su sistema:","windows.download":"Descargue el instalador.","windows.header":"Instalar TurboWarp Desktop para Windows","windows.run":"Ejecute el archivo .exe.","windows.smartscreen":"Si aparece una alerta de Windos SmartScreen, haga click en \"más información\" y luego en \"ejecutar de todos modos\"."},"it":{"alternative":"Download alternativi per altre architetture:","appimage.download":"Scarica app. ({arch})","appimage.header":"Installa TurboWarp Desktop con AppImage","appimage.step2":"Specifica che il file è eseguibile. ({chmod_x_AppImage} o spuntando la caselle in [clic destro] > Proprietà > Permessi)","appimage.step3":"Esegui il file .AppImage","bugs":"I bug vanno segnalati {on_GitHub} o {on_Scratch}.","bugs.on_GitHub":"su GitHub","bugs.on_Scratch":"su Scratch","debian.download":"Scarica pacchetto. ({arch})","debian.header":"Installa TurboWarp Desktop per Debian e Ubuntu","debian.step2":"Installa il file .deb con {apt_install} o usando l'app store della tua distribuzione.","faq.privacy.answer":"Ti preghiamo di leggere {very_short_privacy_policy}.","faq.privacy.answer.very_short_privacy_policy":"breve politica della privacy","faq.privacy.header":"Politica delle privacy","faq.source.answer":"Il codice sorgente di TurboWarp è disponibile su {on_GitHub}. TurboWarp Desktop è coperto dalla licenza GNU General Public License v3.0.","faq.source.answer.on_GitHub":"su GitHub","faq.source.header":"Codice sorgente","faq.speed.answer":"Di solito no, ma può risultare più stabile se il tuo computer non lo scarica per risparmiare memoria.","faq.speed.header":"TurboWarp Desktop è più veloce di TurboWarp online?","faq.update.answer":"La app verifica periodicamente la presenza di aggiornamenti e notifica quando sono disponibili. Per aggiornare, scarica il nuovo installatore ed eseguilo.","faq.update.header":"Come faccio ad aggiornarlo?","header.affiliation":"TurboWarp non è affiliato a Scratch, allo Scratch Team o alla Scratch Foundation.","header.subtitle":"Usa {TurboWarp}, la mod di Scratch dotata di compilatore, dark mode, addon e molto altro come app sul tuo PC. Funziona anche quando non sei online.","mac.header":"Installa TurboWarp Desktop per macOS","mac.step1":"Scarica l'installatore.","mac.step2":"Apri il file .dmg. Sposta TurboWarp Desktop in Applicazioni.","mac.step3":"I nostri file binari sono {not_notarized}, quindi sono necessari alcuni passaggi ulteriori. Apri il Finder, vai a Applicazioni, clicca con il tasto destro su TurboWarp Desktop e selezione \"Apri\" e poi di nuovo \"Apri\".","mac.step3.not_notarized":"non verificati","picture.caption":"Progetto: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer di piano_miles","picture.title":"Progetto: Full Sphere Path Tracer di piano_miles","select":"Scegli il tuo SO:","snap.description":"TurboWarp è disponibile nello Snap Store con il nome {turbowarpdesktop}. Al momento solo i sistemi x86 a 64-bit sono supportati. Alcune caratteristiche di Scratch (microfono, webcam e bluetooth) possono richiedere di intervenire manualmente.","snap.header":"Installa TurboWarp Desktop usando Snap Store","snap.step1":"Installa snapd.","unknown":"Scarica il pacchetto per il suo sistema:","windows.download":"Scarica l'installatore.","windows.header":"Installa TurboWarp Desktop per Windows","windows.run":"Esegui il file .exe.","windows.smartscreen":"Se compare un avviso di Windows, clicca \"More info\" e poi \"Run anyways\""},"ko":{"alternative":"다른 아키텍쳐를 위한 대체 다운로드:","appimage.download":"앱을 다운로드합니다. ({arch})","appimage.header":"Appimage를 이용한 TurboWarp Desktop 설치","appimage.step2":"실행 가능하도록 마킹합니다. ({chmod_x_AppImage} 또는 마우스 우클릭의 체크박스 -> 속성 -> 권한)","appimage.step3":".AppImage를 실행합니다.","bugs":"버그는 {on_GitHub}나 {on_Scratch}를 통해 제보하세요.","bugs.on_GitHub":"GitHub","bugs.on_Scratch":"스크래치","debian.download":"패키지를 다운로드합니다. ({arch})","debian.header":"Debian과 Ubuntu를 위한 터보워프 데스크톱 설치","debian.step2":".deb 파일을 {apt_install}와 함께 설치하거나 앱스토어 배포 버전을 사용하여 설치합니다.","faq.privacy.answer":"{very_short_privacy_policy}를 반드시 읽어주세요.","faq.privacy.answer.very_short_privacy_policy":"간결화된 개인정보 보호 정책 안내","faq.privacy.header":"개인정보 보호 정책","faq.source.answer":"TurboWarp의 소스코드는 {on_GitHub}에 있습니다. TurboWarp Desktop은 GNU General Public License v3.0 라이선스를 사용합니다.","faq.source.answer.on_GitHub":"GitHub","faq.source.header":"소스코드","faq.speed.answer":"일반적으로 아니지만 TurboWarp Desktop은 메모리를 절약하려 하지 않기 때문에 더 안정적일 수 있습니다.","faq.speed.header":"TurboWarp Desktop이 브라우저보다 빠른가요?","faq.update.answer":"앱은 주기적으로 업데이트를 확인하여 이용 가능할 때 당신에게 알립니다. 업데이트를 하려면, 새 Installer를 다운로드한 후 실행합니다.","faq.update.header":"어떻게 업데이트하나요?","header.affiliation":"TurboWarp는 스크래치, 스크래치 팀,  스크래치 재단에 소속되어 있지 않습니다.","header.subtitle":"{TurboWarp}를 이용하여 오프라인일 때에도 당신의 컴퓨터에서 스크래치를 다크 모드, 컴파일러, 애드온과 같은 기능을 사용해 보세요.","mac.header":"macOS를 위한 TurboWarp Desktop 설치","mac.step1":"Installer를 다운로드하세요.","mac.step2":".dmg 파일을 열고, TurboWarp Desktop을 애플리케이션으로 이동하세요.","mac.step3":"우리의 바이너리가 {not_notarized}기 때문에, 추가적인 단계가 요구됩니다. 파인더를 열고, 애플리케이션으로 이동하고, TurboWarp Desktop을 우클릭 한 후 \"열기\"를 선택한 후 다시 \"열기\"를 선택하세요.","mac.step3.not_notarized":"공증받지 않았","picture.caption":"{Full_Sphere_Path_Tracer_by_piano_miles} 프로젝트의 캡쳐","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"piano_miles에 의해 제작된 \"Full Sphere Path Tracer\"","picture.title":"piano_miles에 의해 제작된 \"구슬 오브젝트 레이트레이서\" 프로젝트의 캡쳐","select":"사용하시는 운영체제를 선택해 주세요:","snap.description":"TurboWarp는 Snap Store에서 \"{turbowarpdesktop}\"라는 이름으로 등록되었습니다. 현재 x86기반 64bit만 지원됩니다. 포함된 스크래치 기능(마이크, 카메라, 블루투스)은 매뉴얼 연결을 필요로 할 수 있습니다.","snap.header":"Snap을 이용한 TurboWarp Desktop 설치","snap.step1":"snapd를 설치합니다.","unknown":"사용하는 시스템의 아키텍쳐를 위한 패키지를 다운로드합니다:","windows.download":"Installer를 다운로드하세요.","windows.header":"Windows를 위한 TurboWarp Desktop 설치하기","windows.run":".exe 파일을 실행하세요.","windows.smartscreen":"\"Windows의 PC보호\"라는 알림이 나타나면, \"추가 정보\" 를 클릭한 후 \"실행\" 을 클릭하세요."},"pt":{"alternative":"Downloads alternativos para outras arquiteturas:","appimage.download":"Baixe o app. ({arch})","appimage.header":"Instalar TurboWarp Desktop com um AppImage","appimage.step2":"Marque como executável. ({chmod_x_AppImage} ou marque a opção em botão direito > Propriedades > Permissões)","appimage.step3":"Execute o .AppImage","bugs":"Bugs devem ser reportados {on_GitHub} ou {on_Scratch}.","bugs.on_GitHub":"no GitHub","bugs.on_Scratch":"no Scratch","debian.download":"Baixe o pacote. ({arch})","debian.header":"Instalar TurboWarp Desktop no Debian e Ubuntu","debian.step2":"Instale o arquivo .deb com {apt_install} ou na loja de aplicativo da sua distribuição.","faq.privacy.answer":"Por favor leia a {very_short_privacy_policy}.","faq.privacy.answer.very_short_privacy_policy":"política de privacidade bem curtinha","faq.privacy.header":"Política de privacidade","faq.source.answer":"O código-fonte do TurboWarp está {on_GitHub}. O TurboWarp Desktop tem a licença GNU General Public License v3.0.","faq.source.answer.on_GitHub":"no GitHub","faq.source.header":"Código-fonte","faq.speed.answer":"Normalmente não, mas ele pode ser mais estável já que o seu computador não vai congelá-lo para salvar memória.","faq.speed.header":"O TurboWarp Desktop é mais rápido que no navegador?","faq.update.answer":"O app vai checar por atualizações periodicamente e notificá-lo quando estiverem disponíveis. Para atualizar, baixe o novo instalador e execute-o novamente.","faq.update.header":"Como eu atualizo?","header.affiliation":"O TurboWarp não tem afiliação com o Scratch, a Equipe do Scratch ou a Fundação Scratch.","header.subtitle":"Use o {TurboWarp}, o mod do Scratch com um compilador, modo escuro, addons, e mais, em um app no seu computador. Até funciona sem internet.","mac.header":"Instalar TurboWarp Desktop para macOS","mac.step1":"Baixe o instalador.","mac.step2":"Abra o arquivo .dmg. Mova TurboWarp Desktop até Aplicações.","mac.step3":"Nossos binários {not_notarized}, então são necessários passos adicionais. Abra o Finder, navegue até Aplicações, clique com o botão direito no TurboWarp Desktop e selecione \"Abrir\" e então \"Abrir\" de novo.","mac.step3.not_notarized":"não são notarizados","picture.caption":"Projeto na imagem: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer por piano_miles","picture.title":"Projeto na imagem: Full Sphere Path Tracer por piano_miles","select":"Escolha seu sistema operacional:","snap.description":"O TurboWarp está publicado na Snap Store com o nome {turbowarpdesktop}. Atualmente só a versão x86 64-bit é suportada. Algumas funções do Scratch (microfone, câmera e bluetooth) podem requerer conexão manual.","snap.header":"Instalar TurboWarp Desktop pelo Snap","snap.step1":"Instale snapd.","unknown":"Baixe o pacote para a arquitetura do seu sistema:","windows.download":"Baixe o instalador.","windows.header":"Instalar TurboWarp Desktop para Windows","windows.run":"Rode o arquivo .exe.","windows.smartscreen":"Se um alerta do Windows SmartScreen aparecer, clique em \"Mais informações\" e \"Executar mesmo assim\"."},"ro":{"alternative":"Descărcări alternative pentru alte arhitecturi:","appimage.download":"Descarcă aplicația. ({arch})","appimage.header":"Instalează Turbowarp Desktop cu AppImage","appimage.step3":"Rulează fișierul .AppImage","debian.download":"Descarcă pachetul. ({arch})","header.affiliation":"TurboWarp nu este conectat cu Scratch, Echipa Scratch, sau Fundația Scratch.","mac.step1":"Descarcă instalatorul.","select":"Alege-ți Sistemul de Operare:","unknown":"Descarcă pachetul potrivit arhitecturii sistemului tău:","windows.download":"Descarcă instalatorul.","windows.run":"Rulează fișierul .exe ."},"tr":{"alternative":"Diğer mimariler için alternatif indirmeler:","appimage.download":"Uygulama indir. ({arch})","appimage.header":"Turbowarp Masaüstüyü AppImage ile indirin","appimage.step2":"Yürütülebilir olarak işaretle. ({chmod_x_AppImage} yada sağ tıkladığındaki menüden Özellikler > İzinlerdeki bir tik kutusu) ","appimage.step3":".AppImage'i çalıştır","bugs":"Hatalar {on_GitHub} yada {on_Scratch} bildilirisin.","bugs.on_GitHub":"Githubda","bugs.on_Scratch":"Scratch'te","debian.download":"Bir paket indir. ({arch})","debian.header":"Turbowarp Masaüstüyü Debian ve Ubuntuya İndirin","debian.step2":".deb dosyasını {apt_install} ile yükle yada dağıtımınızın uygulama mağazası ile yükleyebilirsiniz.","faq.privacy.answer":"Lütfen {very_short_privacy_policy}'yı okuyun.","faq.privacy.answer.very_short_privacy_policy":"çok kısa bir güvenlik politika","faq.privacy.header":"Gizillik politikası","faq.source.answer":"Turbowarp'un kaynak kodu {on_GitHub}. Turbowarp Masaüstü GNU Genel Kamu v3.0 ile lisanlanmıştır.","faq.source.answer.on_GitHub":"Githubda","faq.source.header":"Kaynak kodu","faq.speed.answer":"Genellikle hayır, ama daha çok durağan olabilir çünkü bilgisayarın RAM'inden tasarruf etmek için boşaltmaz.","faq.speed.header":"Turbowarp Masaüstü normal Turbowarp'dan daha hızlı mı?","faq.update.answer":"Uygulama periyodik olarak güncellemeleri kontrol edebilir ve bir güncelleme olursa sizi bilgilendirebilir. Güncelemek için yeni yükleyiciyi indirin ve yeniden çalıştır.","faq.update.header":"Nasıl güncelleyebilirim?","header.affiliation":"TurboWarp, Scratch, Scratch Takım veya Scratch Vakıfı ile bağlantılı değildir.","mac.header":"Turbowarp Masaüstüyü macOS'e İndirin","mac.step1":"Yükleyiciyi indirin.","mac.step2":".dmg dosyasını açınız. Turbowarp Masaüstünü ","mac.step3":"Bizim programlarımız {not_notarized}, bu nedenle fazladan adımlar gereklidir. Finder'ı açın, Uygulamalar'a git, Turbowarp Masaütüyü sağ tıkla ve Aç'ı seç ve yeniden Aç'ı şeç.","mac.step3.not_notarized":"noterli değildir","picture.caption":"Fotoğrafta gösterilen proje: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer by piano_miles","picture.title":"Fotoğrafta gösterilen proje: piano_miles tarafından Full Sphere Path Tracer","select":"OS'ini şeçiniz:","snap.description":"TurboWarp, Snap Store'da {turbowarpdesktop} adıyla yayınlanıyor. Şimdilik sadece x86 64-bit destekleniyor. Bazı Scratch özellikleri (mikrofon, kamera ve bluetooth) manuel bağlantı gerektirebilir.","snap.header":"Turbowarp Masaüstüyü Snap ile İndirin","snap.step1":"snapd'yi indirin.","unknown":"Sisteminizin mimarisi için paket indirin:","windows.download":"Yükleyiciyi indirin.","windows.header":"Turbowarp Masaüstüyü Windows'a İndirin","windows.run":".exe dosyasını yürütün.","windows.smartscreen":"Eğer bir Windows SmartScreen uyarı görünülürse, \"Daha Fazla Bilgi\"ye tıkla ve sonra  \"Çalıştır\"a tıkla"}}/*===*/;

  const translatableElements = document.querySelectorAll('[data-l10n]');
  const translatableAttributes = document.querySelectorAll('[data-l10n-attrib]');

  function getId(el) {
    if (el.getAttribute('data-l10n-subkey')) return el.getAttribute('data-l10n-subkey');
    return el.textContent.trim().replace(/\s+/g, '_').replace(/[^a-z_0-9]/gi, '') || ('placeholder' + j);
  }

  function translate(language) {
    if (!allLanguageMessages[language]) language = language.split('-')[0];
    const messages = allLanguageMessages[language];
    if (!messages) return;
    document.documentElement.lang = language;

    for (const el of translatableElements) {
      const nodes = el.childNodes;
      const namedNodes = {};
      const key = el.getAttribute('data-l10n');
      const message = messages[key];

      if (!message) {
        console.warn('Missing message: ' + key);
        continue;
      }

      for (const node of nodes) {
        if (node.nodeName === '#text') continue;
        const id = getId(node);
        namedNodes[id] = node;
        const message = messages[key + '.' + id];
        if (message) {
          node.textContent = message;
        }
      }

      while (el.firstChild) el.removeChild(el.firstChild);

      const messageParts = message.split(/{|}/g);
      for (let i = 0; i < messageParts.length; i++) {
        const part = messageParts[i];
        if (i % 2 === 0) {
          el.appendChild(document.createTextNode(part));
        } else {
          const node = namedNodes[part];
          if (!node) {
            console.warn('Missing named node: ' + part);
            continue;
          }
          el.appendChild(node);
        }
      }
    }

    for (const el of translatableAttributes) {
      for (const [attribute, key] of el.getAttribute('data-l10n-attrib').split(',').map((i) => i.split('='))) {
        const message = messages[key];
        if (!message) {
          console.warn('Missing message: ' + key);
          continue;
        }
        el.setAttribute(attribute, message);
      }
    }
  }

  function genl10n() {
    const result = {};
    for (const el of translatableElements) {
      const nodes = el.childNodes;
      const key = el.getAttribute('data-l10n');

      let translationString = '';
      let textNodes = 0;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let nodeText = node.textContent;
        nodeText = nodeText.replace(/^\s+/, i === 0 ? '' : ' ');
        nodeText = nodeText.replace(/\s+$/, i === nodes.length - 1 ? '' : ' ');
        if (node.nodeName === '#text') {
          translationString += nodeText;
          textNodes++;
        } else {
          const id = getId(node);
          translationString += '{' + id + '}';
          if (node.getAttribute('data-notranslate') === null) {
            result[key + '.' + id] = nodeText;
          }
        }
      }
      if (result[key] && result[key] !== translationString) {
        console.warn('Mismatch: ' + key);
      }
      result[key] = translationString;
      if (textNodes === 0) {
        console.warn('No text nodes: ' + key);
      }
    }

    for (const el of translatableAttributes) {
      for (const [attribute, key] of el.getAttribute('data-l10n-attrib').split(',').map((i) => i.split('='))) {
        const text = el.getAttribute(attribute);
        if (result[key] && result[key] !== text) {
          console.warn('Mismatch: ' + key);
        }
        result[key] = text;
      }
    }

    document.body.appendChild(Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([JSON.stringify(result)])),
      download: 'desktop-web.json'
    })).click();

    return result;
  }

  return {
    translate,
    genl10n
  };
})();
