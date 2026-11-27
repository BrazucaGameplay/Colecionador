import { STAT_UPGRADES } from '../../entities/Player.js';
import PanelFrame from '../components/PanelFrame.js';

export default class ProfilePanel {
  constructor(scene, { close = () => {}, gameScene } = {}) {
    this.scene = scene;
    this.gameScene = gameScene;
    this.page = 0;
    this.frame = new PanelFrame(scene, { title: '', width: 360, height: 520, variant: 'vertical', close });
    const { x, y, width, height } = this.frame;

    // O retrato ativo é carregado da pasta da skin equipada.
    const initialPortraitKey = this.gameScene?.skinManager?.getSelectedDefinition?.()?.portraitKey || 'player-portrait';
    this.portrait = scene.add.image(x + width * 0.5, y + height * 0.49, initialPortraitKey)
      .setDisplaySize(width * 0.43, height * 0.49)
      .setScrollFactor(0).setDepth(4022);
    this.frame.objects.push(this.portrait);
    this.portraitCaption = this.frame.addText(x + width * 0.5, y + height * 0.765, 'PERSONAGEM', {
      fontSize: '12px', fontStyle: 'bold', color: '#ffe8bd', align: 'center'
    }).setOrigin(0.5);

    // Segunda página: mantém a tela atual de atributos.
    this.summary = this.frame.addText(x + width * 0.15, y + height * 0.235, '', {
      fontSize: '13px', fontStyle: 'bold', color: '#ffe8bd', align: 'center',
      wordWrap: { width: width * 0.70 }
    }).setOrigin(0.5, 0.5).setPosition(x + width * 0.5, y + height * 0.235);

    this.rows = [];
    const keys = Object.keys(STAT_UPGRADES);
    const rowStart = 0.315;
    const rowEnd = 0.735;
    const rowGap = keys.length > 1 ? height * (rowEnd - rowStart) / (keys.length - 1) : 0;
    keys.forEach((key, index) => {
      const rowY = y + height * rowStart + index * rowGap;
      const label = this.frame.addText(x + width * 0.145, rowY, STAT_UPGRADES[key].label, {
        fontSize: '12px', fontStyle: 'bold', color: '#fff0dc', align: 'left',
        wordWrap: { width: width * 0.49 }, lineSpacing: 1
      }).setOrigin(0, 0.5);
      const value = this.frame.addText(x + width * 0.665, rowY, '', {
        fontSize: '12px', fontStyle: 'bold', color: '#ffe6b5', align: 'center'
      }).setOrigin(0.5, 0.5);
      const plus = this.frame.addButton({
        x: x + width * 0.825, y: rowY,
        width: Math.max(28, width * 0.115), height: Math.max(17, width * 0.0575),
        label: '+', texture: 'ui-button-200', onClick: () => this.allocate(key)
      });
      this.rows.push({ key, label, value, plus });
    });

    this.footer = this.frame.addText(x + width * 0.5, y + height * 0.795,
      'Use os pontos disponíveis para evoluir os atributos.', {
        fontSize: '9px', fontStyle: 'bold', color: '#f0d5ad', align: 'center',
        wordWrap: { width: width * 0.70 }, lineSpacing: 1
      }).setOrigin(0.5, 0.5);

    this.skinHeading = this.frame.addText(x + width * 0.5, y + height * 0.245, 'APARÊNCIA DO PERSONAGEM', {
      fontSize: '12px', fontStyle: 'bold', color: '#ffe8bd', align: 'center'
    }).setOrigin(0.5);
    this.skinItems = [];
    (this.gameScene?.skinManager?.getCatalog?.() || []).forEach((skin,index) => {
      const rowY=y+height*(0.43+index*0.205);
      const portraitKey = skin.portraitKey || 'player-portrait';
      const image=scene.add.image(x+width*0.27,rowY,portraitKey).setDisplaySize(width*0.19,height*0.17).setScrollFactor(0).setDepth(4022);
      this.frame.objects.push(image);
      const name=this.frame.addText(x+width*0.43,rowY-height*0.035,skin.name,{fontSize:'11px',fontStyle:'bold',color:'#fff0dc',align:'left'}).setOrigin(0,0.5);
      const status=this.frame.addText(x+width*0.43,rowY+height*0.025,'',{fontSize:'9px',color:'#f0d5ad',align:'left'}).setOrigin(0,0.5);
      const button=this.frame.addButton({x:x+width*0.72,y:rowY+height*0.075,width:width*0.34,height:Math.max(20,width*0.075),label:'EQUIPAR',texture:'ui-button-200',onClick:()=>this.equipSkin(skin.id)});
      this.skinItems.push({id:skin.id,image,name,status,button});
    });

    this.previousButton = this.frame.addButton({
      x: x + width * 0.28, y: y + height * 0.865,
      width: Math.max(34, width * 0.13), height: Math.max(19, width * 0.065),
      label: '‹', texture: 'ui-button-200', onClick: () => this.setPage(this.page - 1)
    });
    this.pageIndicator = this.frame.addText(x + width * 0.5, y + height * 0.865, '1 / 3', {
      fontSize: '11px', fontStyle: 'bold', color: '#ffe8bd', align: 'center'
    }).setOrigin(0.5);
    this.nextButton = this.frame.addButton({
      x: x + width * 0.72, y: y + height * 0.865,
      width: Math.max(34, width * 0.13), height: Math.max(19, width * 0.065),
      label: '›', texture: 'ui-button-200', onClick: () => this.setPage(this.page + 1)
    });

    this.refresh();
    this.setPage(0);
  }

  equipSkin(id) {
    const result=this.gameScene?.skinManager?.selectSkin(id);
    this.refresh(); return Boolean(result?.changed);
  }

  setPage(page) {
    this.page = Math.max(0, Math.min(2, page));
    const showPortrait = this.page === 0;
    const showStats = this.page === 1;
    const showSkins = this.page === 2;
    this.portrait.setVisible(showPortrait);
    this.portraitCaption.setVisible(showPortrait);
    this.summary.setVisible(showStats);
    this.footer.setVisible(showStats);
    this.skinHeading.setVisible(showSkins);
    for(const item of this.skinItems){
      item.image.setVisible(showSkins);item.name.setVisible(showSkins);item.status.setVisible(showSkins);
      item.button.background.setVisible(showSkins);item.button.label.setVisible(showSkins);
    }
    for (const row of this.rows) {
      row.label.setVisible(showStats);
      row.value.setVisible(showStats);
      row.plus.background.setVisible(showStats);
      row.plus.label.setVisible(showStats);
    }
    this.previousButton.setAlpha(this.page === 0 ? 0.45 : 1);
    this.nextButton.setAlpha(this.page === 2 ? 0.45 : 1);
    this.pageIndicator.setText((this.page + 1) + ' / 3');
  }

  allocate(key) {
    const game = this.gameScene;
    if (!game?.player?.allocateStat(key)) return;
    game.persistProgress?.();
    this.refresh();
  }

  refresh() {
    const player = this.gameScene?.player;
    if (!player || !this.summary) return;
    const portraitKey = this.gameScene?.skinManager?.getSelectedDefinition?.()?.portraitKey || 'player-portrait';
    this.portrait.setTexture(portraitKey);
    const required = this.gameScene.progression?.getRequiredExperience(player.level) ?? 0;
    this.summary.setText('Nível ' + player.level + '  •  EXP ' + player.experience +
      '/' + required + '  •  Pontos: ' + player.statPoints);
    for (const row of this.rows) {
      row.value.setText(STAT_UPGRADES[row.key].format(player.stats[row.key]));
      row.plus.setAlpha(player.statPoints > 0 ? 1 : 0.45);
    }
    const catalog=this.gameScene?.skinManager?.getCatalog?.()||[];
    for(const item of this.skinItems){
      const skin=catalog.find(entry=>entry.id===item.id); if(!skin)continue;
      item.status.setText(skin.selected?'EQUIPADA':skin.selectable?'DISPONÍVEL':'EM PREPARAÇÃO');
      item.button.setText(skin.selected?'EQUIPADA':skin.selectable?'EQUIPAR':'INDISPONÍVEL');
      item.button.setAlpha(skin.selectable&&!skin.selected?1:0.5);
    }
    this.setPage(this.page);
  }

  destroy() {
    this.frame?.destroy();
    this.rows.length = 0;
    this.skinItems.length = 0;
    this.skinHeading = null;
    this.summary = null;
    this.footer = null;
    this.portrait = null;
    this.portraitCaption = null;
    this.previousButton = null;
    this.nextButton = null;
    this.pageIndicator = null;
    this.gameScene = null;
    this.scene = null;
  }
}
