window.L = (function () {
  const allLanguageMessages = /*===*/{"de":{"alternative":"Alternative Downloads für andere Architekturen:","appimage.download":"App herunterladen. ({arch})","appimage.header":"TurboWar Desktop mit AppImage installieren.","appimage.step2":"Als Ausführbar markieren. ({chmod_x_AppImage} oder eine Checkbox in rechte Maustaste > Eigenschaften > Berechtigungen)","appimage.step3":"Führe die .Appimage aus","bugs":"Fehler solltenauf {on_GitHub} oder {on_Scratch} gemeldet werden.","bugs.on_GitHub":"auf GitHub","bugs.on_Scratch":"auf Scratch","debian.download":"Paket herunterladen. ({arch})","debian.header":"TurboWarp Desktop für Debian und Ubuntu installieren","debian.step2":".deb-Datei mit Paketemanager deiner Distribution installieren.","faq.privacy.answer":"Bitte lies die {very_short_privacy_policy} durch.","faq.privacy.answer.very_short_privacy_policy":"sehr kurze Datenschutzerklärung","faq.privacy.header":"Datenschutzerklärung","faq.source.answer":"TurboWarps Quellcode ist {on_GitHub}. TurboWarp ist unter der GNU General Public License v3.0 lizensiert.","faq.source.answer.on_GitHub":"auf GitHub","faq.source.header":"Quellcode","faq.speed.answer":"Normalerweise nicht, aber es ist möglicherweise stabiler, da Ihr Computer es nicht entlädt, um Speicherplatz zu sparen.","faq.speed.header":"Ist TurboWarp Desktop schneller als das normale TurboWarp?","faq.update.answer":"Die App wird manchmal nach Updates suchen und dich benachrichtigen, wenn eines Verfügbar ist. Um es zu aktualisieren, lade den neuen Installer herunter und starte ihn erneut.","faq.update.header":"Wie aktualisiere ich es?","header.affiliation":"TurboWarp ist nicht mit Scratch, dem Scratch Team oder der Scratch-Stiftung verbunden.","header.subtitle":"Verwende TurboWarp mit einer App auf deinem Desktop, auch wenn du offline bist.","mac.header":"TurboWarp Desktop für macOS installieren","mac.step1":"Installer herunterladen.","mac.step2":"Öffne die .dmg-Datei. Verschiebe TurboWarp Desktop in Applications.","mac.step3":"Unsere Binärdateien sind {not_notarized}, deshalb werden Extraschritte benötigt. Öffne den Finder, navigiere zu Applications, klicke TurboWarp Desktop mit der rechten Maustaste an und wähle \"Öffnen\" und dann wieder \"Öffnen\" aus.","mac.step3.not_notarized":"nicht notarisiert","picture.caption":"Angezeigtes Projekt: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer von piano_miles","picture.title":"Angezeigtes Projekt: Full Sphere Path Tracer von piano_miles","select":"Wähle dein OS aus:","snap.description":"TurboWarp ist im Snap-Store mit dem Namen {turbowarpdesktop} veröffentlicht. Aktuell ist nur x86 64-Bit unterstützt. Manche Scratch-Features (Mikrofon, Kamera, Bluetooth) könnten manuelle Verbindungen benötigen.","snap.header":"TurboWarp Desktop mit Snap installieren","snap.step1":"Snapd installieren.","unknown":"Paket für deine Sysemarchitektur herunterladen:","windows.download":"Installer herunterladen.","windows.header":"TurboWarp Desktop für Windows installieren","windows.run":".exe-Datei ausführen.","windows.smartscreen":"Falls eine Warnung von Windows SmartScreen erscheint, klicke auf \"Weitere Informationen\" und dann auf \"Trotzdem ausführen\""},"pt":{"alternative":"Downloads alternativos para outras arquiteturas:","appimage.download":"Baixe o app. ({arch})","appimage.header":"Instalar TurboWarp Desktop com um AppImage","appimage.step2":"Marque como executável. ({chmod_x_AppImage} ou marque a opção em botão direito > Propriedades > Permissões)","appimage.step3":"Execute o .AppImage","bugs":"Bugs devem ser reportados {on_GitHub} ou {on_Scratch}.","bugs.on_GitHub":"no GitHub","bugs.on_Scratch":"no Scratch","debian.download":"Baixe o pacote. ({arch})","debian.header":"Instalar TurboWarp Desktop no Debian e Ubuntu","debian.step2":"Instale o arquivo .deb usando o administrador de pacotes da sua distribuição.","faq.privacy.answer":"Por favor leia a {very_short_privacy_policy}.","faq.privacy.answer.very_short_privacy_policy":"política de privacidade bem curtinha","faq.privacy.header":"Política de privacidade","faq.source.answer":"O código-fonte do TurboWarp está {on_GitHub}. O TurboWarp Desktop tem a licença GNU General Public License v3.0.","faq.source.answer.on_GitHub":"no GitHub","faq.source.header":"Código-fonte","faq.speed.answer":"Normalmente não, mas ele pode ser mais estável já que o seu computador não vai congelá-lo para salvar memória.","faq.speed.header":"O TurboWarp Desktop é mais rápido que no navegador?","faq.update.answer":"O app vai checar por atualizações periodicamente e notificá-lo quando estiverem disponíveis. Para atualizar, baixe o novo instalador e execute-o novamente.","faq.update.header":"Como eu atualizo?","header.affiliation":"O TurboWarp não tem afiliação com o Scratch, a Equipe do Scratch ou a Fundação Scratch.","header.subtitle":"Use o TurboWarp em um app no seu computador, até se estiver offline.","mac.header":"Instalar TurboWarp Desktop para macOS","mac.step1":"Baixe o instalador.","mac.step2":"Abra o arquivo .dmg. Mova TurboWarp Desktop até Aplicações.","mac.step3":"Nossos binários {not_notarized}, então são necessários passos adicionais. Abra o Finder, navegue até Aplicações, clique com o botão direito no TurboWarp Desktop e selecione \"Abrir\" e então \"Abrir\" de novo.","mac.step3.not_notarized":"não são notarizados","picture.caption":"Projeto na imagem: {Full_Sphere_Path_Tracer_by_piano_miles}","picture.caption.Full_Sphere_Path_Tracer_by_piano_miles":"Full Sphere Path Tracer por piano_miles","picture.title":"Projeto na imagem: Full Sphere Path Tracer por piano_miles","select":"Escolha seu sistema operacional:","snap.description":"O TurboWarp está publicado na Snap Store com o nome {turbowarpdesktop}. Atualmente só a versão x86 64-bit é suportada. Algumas funções do Scratch (microfone, câmera e bluetooth) podem requerer conexão manual.","snap.header":"Instalar TurboWarp Desktop pelo Snap","snap.step1":"Instale snapd.","unknown":"Baixe o pacote para a arquitetura do seu sistema:","windows.download":"Baixe o instalador.","windows.header":"Instalar TurboWarp Desktop para Windows","windows.run":"Rode o arquivo .exe.","windows.smartscreen":"Se um alerta do Windows SmartScreen aparecer, clique em \"Mais informações\" e \"Executar mesmo assim\"."}}/*===*/;

  const translatableElements = document.querySelectorAll('[data-l10n]');
  const translatableAttributes = document.querySelectorAll('[data-l10n-attrib]');

  function getId(el) {
    if (el.getAttribute('data-l10n-subkey')) return el.getAttribute('data-l10n-subkey');
    return el.textContent.trim().replace(/\s+/g, '_').replace(/[^a-z_0-9]/gi, '') || ('placeholder' + j);
  }

  const DEBUG = false;
  function dbg() {
    return (dbg.counter = (dbg.counter || 0) + 1) % 10;
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
          if (DEBUG) node.textContent = node.textContent.replace(/[\w]/g, dbg());
        }
      }

      while (el.firstChild) el.removeChild(el.firstChild);

      const messageParts = message.split(/{|}/g);
      for (let i = 0; i < messageParts.length; i++) {
        let part = messageParts[i];
        if (i % 2 === 0) {
          if (DEBUG) part = part.replace(/[\w]/g, dbg());
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
        let message = messages[key];
        if (!message) {
          console.warn('Missing message: ' + key);
          continue;
        }
        if (DEBUG) message = message.replace(/[\w]/g, dbg());
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
