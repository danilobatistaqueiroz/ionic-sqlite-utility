import { Filesystem, Directory, Encoding, GetUriOptions, StatResult, FileInfo, ReaddirResult, ReadFileResult } from '@capacitor/filesystem';

import { Component, OnInit } from '@angular/core';
import { AlertController, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { Product } from '../models/product';

import { CapacitorSQLite, CapacitorSQLitePlugin, SQLiteConnection, SQLiteDBConnection, capSQLiteResult } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

import { environment } from 'src/environments/environment';

import {HijackSqlite} from 'hijack-sqlite';

import { Toast } from '@capacitor/toast';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  isAndroid: boolean = false;

  products?: Product[];

  dbName:string=environment.productsDB;
  dbVersion:number=1;

  sqliteConnection!: SQLiteConnection;
  sqlitePlugin!: CapacitorSQLitePlugin;

  dbConnection!: SQLiteDBConnection;

  passphrase?: string;
  oldpassphrase?: string;

  constructor(private platform:Platform, private alert:AlertController) {}

  async ngOnInit() {
  }

  copyToDocuments(){
    console.log('copyToDocuments');
    let result = HijackSqlite.copyToDocuments({appID:'br.labs.securityp',name:this.dbName});
    console.log(result.result);
  }
  copyToUserData(){
    console.log('copyToUserData');
    let result = HijackSqlite.copyToUserData({appID:'br.labs.securityp',name:this.dbName});
    console.log(result.result);
  }
  clearPassphrase(){
    console.log('clearPassphrase');
    CapacitorSQLite.clearEncryptionSecret();
  }
  async changePassphrase(){
    console.log('changePassphrase');
    if(!this.passphrase || !this.oldpassphrase){
      const alert = await this.alert.create({
        header: 'Passphrase em branco',
        message: 'Preencha uma passphrase!',
        buttons: [
          {
            text: 'OK',
            handler: (alertData) => {
              alert.dismiss({passphrase:alertData.passphrase,oldpassphrase:alertData.oldpassphrase});
              return false;
            }
          }
        ],
        inputs: [
          { name: 'passphrase', type: 'text' },
          { name: 'oldpassphrase', type: 'text' },
        ],
      });
      await alert.present();
      await alert.onDidDismiss().then((data) => {
        this.passphrase = data.data.passphrase;
        this.oldpassphrase = data.data.oldpassphrase;
      });
    }
    if(!this.passphrase || !this.oldpassphrase)
      return;
    CapacitorSQLite.changeEncryptionSecret({passphrase:this.passphrase,oldpassphrase:this.oldpassphrase})
  }
  closeDatabase(){
    console.log('closeDatabase');
    this.products = [];
    CapacitorSQLite.close({database:this.dbName});
    CapacitorSQLite.closeConnection({database:this.dbName});
  }
  deleteDatabase(){
    console.log('deleteDatabase');
    CapacitorSQLite.deleteDatabase({database:this.dbName});
    HijackSqlite.deleteDatabase({appID:'br.labs.securityp',name:this.dbName});
  }
  async isSecretStored(){
    console.log('isSecretStored');
    let secret = await CapacitorSQLite.isSecretStored();
    console.log('is secret stored:' + secret.result);
  }
  async checkPassphrase(){
    console.log('checkPassphrase');
    try{
      let resultCheck = await CapacitorSQLite.checkEncryptionSecret({passphrase:this.passphrase??''});
      console.log('checkEncryptionSecret',resultCheck.result);
    } catch (ex) {
      console.error(ex);
    }
    try{
      let resultIs = await CapacitorSQLite.isDatabaseEncrypted({database:this.dbName});
      console.log('isDatabaseEncrypted',resultIs.result);
    } catch (ex) {
      console.error(ex);
    }
  }

  async startSqlite(){
    if (this.platform.is('android')) {
      this.isAndroid = true;
    }
    await this.initializeSqlite();
    let secret:capSQLiteResult = await CapacitorSQLite.isSecretStored();
    console.log('secret',secret.result);
    if(secret.result==false) {
      const alert = await this.alert.create({
        header: 'Passphrase em branco',
        message: 'Preencha uma passphrase!',
        buttons: [
          {
            text: 'OK',
            handler: (alertData) => {
              alert.dismiss(alertData.passphrase);
              return false;
            }
          }
        ],
        inputs: [
          {
              name: 'passphrase',
              type: 'text'
          }],
      });
      await alert.present();
      await alert.onDidDismiss().then((data) => {
        this.passphrase = data.data;
      });
      if(this.passphrase) {
        console.log('encrypting the database with passphrase');
        CapacitorSQLite.setEncryptionSecret({passphrase:this.passphrase});
      }
    } else {
      console.log('secret true');
    }
    if(!this.passphrase) {
      await this.openConnection(this.dbName,false,"",this.dbVersion,false);
      await Toast.show({
        text: `database openned without passpharase`,
        duration: 'long'
      });
    } else {
      await this.openConnection(this.dbName,true,"secret",this.dbVersion,false);
      await Toast.show({
        text: `database openned with passpharase`,
        duration: 'long'
      });
    }
    await this.insertProduct();
  }

  async initializeSqlite() {
    console.log('initializeSqlite');
    await this.initializePlugin().then(async (ret) => {
      try {
        if(Capacitor.getPlatform()==="web") {
          await this.initWebStore();
        }
        await this.initializeStructureDB();
      } catch (error) {
        console.error(error)
      }
    });
  }

  async initializeStructureDB(){
    console.log('initializeStructureDB');
    let commands = [
      `CREATE TABLE IF NOT EXISTS product (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        name varchar NOT NULL,
        description varchar NOT NULL,
        price bigint,
        photo blob,
        CONSTRAINT "product_name_constraintUQ" UNIQUE ("name")
      );`,
      `CREATE INDEX IF NOT EXISTS product_index_name ON product (name);`,
    ]
    let options = { database: this.dbName, upgrade: [{toVersion: this.dbVersion, statements: commands}]};
    await this.sqlitePlugin.addUpgradeStatement(options);
  }

  async initWebStore(): Promise<void> {
    try {
      console.log('initWebStore');
      await this.sqliteConnection.initWebStore();
    } catch(err: any) {
      console.error(err);
      return Promise.reject(`initWebStore: ${err}`);
    }
  }

  async initializePlugin(): Promise<boolean> {
    this.sqlitePlugin = CapacitorSQLite;
    this.sqliteConnection = new SQLiteConnection(this.sqlitePlugin);
    return true;
  }

  async getAllProducts(): Promise<Product[]> {
    this.products = (await this.dbConnection.query("select * from product")).values as Product[];
    return this.products;
  }

  async openConnection(dbName:string, encrypted: boolean, mode: string, version: number, readonly: boolean) {
    console.log('openConnection');
    let db: SQLiteDBConnection;
    const retCC = (await this.sqliteConnection.checkConnectionsConsistency()).result;
    let isConn = (await this.sqliteConnection.isConnection(dbName, readonly)).result;
    if(retCC && isConn) {
      db = await this.sqliteConnection.retrieveConnection(dbName, readonly);
    } else {
      db = await this.sqliteConnection.createConnection(dbName, encrypted, mode, version, readonly);
    }
    await db.open();
    console.log(db);
    this.dbConnection = db;
  }

  exitApp() {
    App.exitApp();
  }

  async insertProduct(name:string='FirePhone F10',description:string='Fire Fox Phone F10',price:number=1200){
    console.log('insertProduct',name,description,price);
    let result:Product[] = (await this.dbConnection.query("select * from product where name=?",[name])).values as Product[];
    if(result.length==0) {
      await this.dbConnection.run("insert into product (name,description,price,photo) values (?,?,?,?);",[name,description,price,null],false);
      if(Capacitor.getPlatform()==="web") {
        await this.sqliteConnection.saveToStore(this.dbName);
      }
    }
  }

}
