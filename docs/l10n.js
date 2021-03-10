window.L = (function () {
  const allLanguageMessages = /*===*/{"de":{"alternative":"Alternative Downloads für andere Architekturen:","appimage.download":"App herunterladen. ({arch})","appimage.header":"TurboWar Desktop mit AppImage installieren.","appimage.step2":"Als Ausführbar markieren. ({chmod_x_AppImage} oder eine Checkbox in rechte Maustaste > Eigenschaften > Berechtigungen)","appimage.step3":"Führe die .Appimage aus","bugs":"Fehler solltenauf {on_GitHub} oder {on_Scratch} gemeldet werden.","bugs.on_GitHub":"auf GitHub","bugs.on_Scratch":"auf Scratch","debian.download":"Paket herunterladen. ({arch})","debian.header":"TurboWarp Desktop für Debian und Ubuntu installieren","debian.step2":".deb-Datei mit Paketemanager deiner Distribution installieren.","faq.privacy.answer":"Bitte lies die {very_short_privacy_policy} durch.","faq.privacy.answer.very_short_privacy_policy":"sehr kurze Datenschutzerklärung","faq.privacy.header":"Datenschutzerklärung","faq.source.answer":"TurboWarps Quellcode ist {on_GitHub}. TurboWarp ist unter der GNU General Public License v3.0 lizensiert.","faq.source.answer.on_GitHub":"auf GitHub","faq.source.header":"Quellcode","faq.speed.answer":"Normalerweise nicht, aber es ist möglicherweise stabiler, da Ihr Computer es nicht entlädt, um Speicherplatz zu sparen.","faq.speed.header":"Ist TurboWarp Desktop schneller als das normale TurboWarp?","faq.update.answer":"Die App wird manchmal nach Updates suchen und dich benachrichtigen, wenn eines Verfügbar ist. Um es zu aktualisieren, lade den neuen Installer herunter und starte ihn erneut.","faq.update.header":"Wie aktualisiere ich es?","header.affiliation":"TurboWarp ist nicht mit Scratch, dem Scratch Team oder der Scratch-Stiftung verbunden.","header.subtitle":"Verwende TurboWarp mit einer App auf deinem Desktop, auch wenn du offline bist.","mac.header":"TurboWarp Desktop für macOS installieren","mac.step1":"Installer herunterladen.","mac.step2":"Öffne die .dmg-Datei. Verschiebe TurboWarp Desktop in Applications.","mac.step3":"Unsere Binärdateien sind {not_notarized}, deshalb werden Extraschritte benötigt. Öffne den Finder, navigiere zu Applications, klicke TurboWarp Desktop mit der rechten Maustaste an und wähle \"Öffnen\" und dann wieder \"Öffnen\" aus.","mac.step3.not_notarized":"nicht notarisiert","picture.caption":"Angezeigtes Projekt: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer von piano_miles","picture.title":"Angezeigtes Projekt: Full Sphere Path Tracer von piano_miles","select":"Wähle dein OS aus:","snap.description":"TurboWarp ist im Snap-Store mit dem Namen {turbowarpdesktop} veröffentlicht. Aktuell ist nur x86 64-Bit unterstützt. Manche Scratch-Features (Mikrofon, Kamera, Bluetooth) könnten manuelle Verbindungen benötigen.","snap.header":"TurboWarp Desktop mit Snap installieren","snap.step1":"Snapd installieren.","unknown":"Paket für deine Sysemarchitektur herunterladen:","windows.download":"Installer herunterladen.","windows.header":"TurboWarp Desktop für Windows installieren","windows.run":".exe-Datei ausführen.","windows.smartscreen":"Falls eine Warnung von Windows SmartScreen erscheint, klicke auf \"Weitere Informationen\" und dann auf \"Trotzdem ausführen\""},"it":{"alternative":"Download alternativi per altre architetture:","appimage.download":"Scarica app. ({arch})","appimage.header":"Installa TurboWarp Desktop con AppImage","appimage.step2":"Specifica che il file è eseguibile. ({chmod_x_AppImage} o spuntando la caselle in [clic destro] > Proprietà > Permessi)","appimage.step3":"Esegui il file .AppImage","bugs":"I bug vanno segnalati {on_GitHub} o {on_Scratch}.","bugs.on_GitHub":"su GitHub","bugs.on_Scratch":"su Scratch","debian.download":"Scarica pacchetto. ({arch})","debian.header":"Installa TurboWarp Desktop per Debian e Ubuntu","debian.step2":"Installa il file .deb usando il gestore di pacchetti della tua distribuzione.","faq.privacy.answer":"Ti preghiamo di leggere {very_short_privacy_policy}.","faq.privacy.answer.very_short_privacy_policy":"breve politica della privacy","faq.privacy.header":"Politica delle privacy","faq.source.answer":"Il codice sorgente di TurboWarp è disponibile su {on_GitHub}. TurboWarp Desktop è coperto dalla licenza GNU General Public License v3.0.","faq.source.answer.on_GitHub":"su GitHub","faq.source.header":"Codice sorgente","faq.speed.answer":"Di solito no, ma può risultare più stabile se il tuo computer non lo scarica per risparmiare memoria.","faq.speed.header":"TurboWarp Desktop è più veloce di TurboWarp online?","faq.update.answer":"La app verifica periodicamente la presenza di aggiornamenti e notifica quando sono disponibili. Per aggiornare, scarica il nuovo installatore ed eseguilo.","faq.update.header":"Come faccio ad aggiornarlo?","header.affiliation":"TurboWarp non è affiliato a Scratch, allo Scratch Team o alla Scratch Foundation.","header.subtitle":"Usa TurboWarp come app sul tuo computer anche quando sei offline.","mac.header":"Installa TurboWarp Desktop per macOS","mac.step1":"Scarica l'installatore.","mac.step2":"Apri il file .dmg. Sposta TurboWarp Desktop in Applicazioni.","mac.step3":"I nostri file binari sono {not_notarized}, quindi sono necessari alcuni passaggi ulteriori. Apri il Finder, vai a Applicazioni, clicca con il tasto destro su TurboWarp Desktop e selezione \"Apri\" e poi di nuovo \"Apri\".","mac.step3.not_notarized":"non verificati","picture.caption":"Progetto: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer di piano_miles","picture.title":"Progetto: Full Sphere Path Tracer di piano_miles","select":"Scegli il tuo SO:","snap.description":"TurboWarp è disponibile nello Snap Store con il nome {turbowarpdesktop}. Al momento solo i sistemi x86 a 64-bit sono supportati. Alcune caratteristiche di Scratch (microfono, webcam e bluetooth) possono richiedere di intervenire manualmente.","snap.header":"Installa TurboWarp Desktop usando Snap Store","snap.step1":"Installa snapd.","unknown":"Scarica il pacchetto per il suo sistema:","windows.download":"Scarica l'installatore.","windows.header":"Installa TurboWarp Desktop per Windows","windows.run":"Esegui il file .exe.","windows.smartscreen":"Se compare un avviso di Windows, clicca \"More info\" e poi \"Run anyways\""},"pt":{"alternative":"Downloads alternativos para outras arquiteturas:","appimage.download":"Baixe o app. ({arch})","appimage.header":"Instalar TurboWarp Desktop com um AppImage","appimage.step2":"Marque como executável. ({chmod_x_AppImage} ou marque a opção em botão direito > Propriedades > Permissões)","appimage.step3":"Execute o .AppImage","bugs":"Bugs devem ser reportados {on_GitHub} ou {on_Scratch}.","bugs.on_GitHub":"no GitHub","bugs.on_Scratch":"no Scratch","debian.download":"Baixe o pacote. ({arch})","debian.header":"Instalar TurboWarp Desktop no Debian e Ubuntu","debian.step2":"Instale o arquivo .deb usando o administrador de pacotes da sua distribuição.","faq.privacy.answer":"Por favor leia a {very_short_privacy_policy}.","faq.privacy.answer.very_short_privacy_policy":"política de privacidade bem curtinha","faq.privacy.header":"Política de privacidade","faq.source.answer":"O código-fonte do TurboWarp está {on_GitHub}. O TurboWarp Desktop tem a licença GNU General Public License v3.0.","faq.source.answer.on_GitHub":"no GitHub","faq.source.header":"Código-fonte","faq.speed.answer":"Normalmente não, mas ele pode ser mais estável já que o seu computador não vai congelá-lo para salvar memória.","faq.speed.header":"O TurboWarp Desktop é mais rápido que no navegador?","faq.update.answer":"O app vai checar por atualizações periodicamente e notificá-lo quando estiverem disponíveis. Para atualizar, baixe o novo instalador e execute-o novamente.","faq.update.header":"Como eu atualizo?","header.affiliation":"O TurboWarp não tem afiliação com o Scratch, a Equipe do Scratch ou a Fundação Scratch.","header.subtitle":"Use o TurboWarp em um app no seu computador, até se estiver offline.","mac.header":"Instalar TurboWarp Desktop para macOS","mac.step1":"Baixe o instalador.","mac.step2":"Abra o arquivo .dmg. Mova TurboWarp Desktop até Aplicações.","mac.step3":"Nossos binários {not_notarized}, então são necessários passos adicionais. Abra o Finder, navegue até Aplicações, clique com o botão direito no TurboWarp Desktop e selecione \"Abrir\" e então \"Abrir\" de novo.","mac.step3.not_notarized":"não são notarizados","picture.caption":"Projeto na imagem: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer por piano_miles","picture.title":"Projeto na imagem: Full Sphere Path Tracer por piano_miles","select":"Escolha seu sistema operacional:","snap.description":"O TurboWarp está publicado na Snap Store com o nome {turbowarpdesktop}. Atualmente só a versão x86 64-bit é suportada. Algumas funções do Scratch (microfone, câmera e bluetooth) podem requerer conexão manual.","snap.header":"Instalar TurboWarp Desktop pelo Snap","snap.step1":"Instale snapd.","unknown":"Baixe o pacote para a arquitetura do seu sistema:","windows.download":"Baixe o instalador.","windows.header":"Instalar TurboWarp Desktop para Windows","windows.run":"Rode o arquivo .exe.","windows.smartscreen":"Se um alerta do Windows SmartScreen aparecer, clique em \"Mais informações\" e \"Executar mesmo assim\"."},"tr":{"alternative":"Diğer mimariler için alternatif indirmeler:","appimage.download":"Uygulama indir. ({arch})","appimage.header":"Turbowarp Masaüstüyü AppImage ile indirin","appimage.step3":".AppImage'i çalıştır","bugs":"Hatalar {on_GitHub} yada {on_Scratch} bildilirisin.","bugs.on_GitHub":"Githubda","bugs.on_Scratch":"Scratch'te","debian.download":"Bir paket indir. ({arch})","debian.header":"Turbowarp Masaüstüyü Debian ve Ubuntuya İndirin","faq.privacy.answer":"Lütfen {very_short_privacy_policy}'yı okuyun.","faq.privacy.answer.very_short_privacy_policy":"çok kısa bir güvenlik politika","faq.privacy.header":"Gizillik politikası","faq.source.answer":"Turbowarp'un kaynak kodu {on_GitHub}. Turbowarp Masaüstü GNU Genel Kamu v3.0 ile lisanlanmıştır.","faq.source.answer.on_GitHub":"Githubda","faq.source.header":"Kaynak kodu","faq.speed.answer":"Genellikle hayır, ama daha çok durağan olabilir çünkü bilgisayarın RAM'inden tasarruf etmek için boşaltmaz.","faq.speed.header":"Turbowarp Masaüstü normal Turbowarp'dan daha hızlı mı?","faq.update.header":"Nasıl güncelleyebilirim?","header.affiliation":"TurboWarp, Scratch, Scratch Takım veya Scratch Vakıfı ile bağlantılı değildir.","header.subtitle":"Eğer senin internetin yoksa halen Turbowarp'u masaüstünde bir uygulama ile kullanabilirsin.","mac.header":"Turbowarp Masaüstüyü macOS'e İndirin","mac.step1":"Yükleyiciyi indirin.","mac.step2":".dmg dosyasını açınız. Turbowarp Masaüstünü ","mac.step3":"Bizim programlarımız {not_notarized}, bu nedenle fazladan adımlar gereklidir. Finder'ı açın, Uygulamalar'a git, Turbowarp Masaütüyü sağ tıkla ve Aç'ı seç ve yeniden Aç'ı şeç.","mac.step3.not_notarized":"noterli değildir","picture.caption":"Fotoğrafta gösterilen proje: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer by piano_miles","picture.title":"Fotoğrafta gösterilen proje: piano_miles tarafından Full Sphere Path Tracer","select":"OS'ini şeçiniz:","snap.description":"TurboWarp, Snap Store'da {turbowarpdesktop} adıyla yayınlanıyor. Şimdilik sadece x86 64-bit destekleniyor. Bazı Scratch özellikleri (mikrofon, kamera ve bluetooth) manuel bağlantı gerektirebilir.","snap.header":"Turbowarp Masaüstüyü Snap ile İndirin","snap.step1":"snapd'yi indirin.","windows.download":"Yükleyiciyi indirin.","windows.header":"Turbowarp Masaüstüyü Windows'a İndirin","windows.run":".exe dosyasını yürütün.","windows.smartscreen":"Eğer bir Windows SmartScreen uyarı görünülürse, \"Daha Fazla Bilgi\"ye tıkla ve sonra  \"Çalıştır\"a tıkla"}}/*===*/;

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
