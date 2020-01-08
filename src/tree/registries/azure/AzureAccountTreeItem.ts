/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { extensions } from 'vscode';
import { AzExtParentTreeItem, AzExtTreeItem, AzureAccountTreeItemBase, IActionContext, ISubscriptionContext } from "vscode-azureextensionui";
import { delay } from '../../../utils/delay';
import { ICachedRegistryProvider } from "../ICachedRegistryProvider";
import { IRegistryProviderTreeItem } from "../IRegistryProviderTreeItem";
import { getRegistryContextValue, registryProviderSuffix } from "../registryContextValues";
import { SubscriptionTreeItem } from "./SubscriptionTreeItem";

export class AzureAccountTreeItem extends AzureAccountTreeItemBase implements IRegistryProviderTreeItem {
    public cachedProvider: ICachedRegistryProvider;

    public constructor(parent: AzExtParentTreeItem, cachedProvider: ICachedRegistryProvider) {
        super(parent);
        this.cachedProvider = cachedProvider;
    }

    public get contextValue(): string {
        return getRegistryContextValue(this, registryProviderSuffix);
    }

    public set contextValue(_value: string) {
        // this is needed because the parent `AzureAccountTreeItemBase` has a setter, but we ignore `_value` in favor of the above getter
    }

    public createSubscriptionTreeItem(subContext: ISubscriptionContext): SubscriptionTreeItem {
        return new SubscriptionTreeItem(this, subContext);
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const treeItems: AzExtTreeItem[] = await super.loadMoreChildrenImpl(_clearCache, context);

        if (treeItems.length === 1 && treeItems[0].commandId === 'extension.open') {
            // tslint:disable-next-line: no-floating-promises
            this.refreshNodeWhenAzureExtensionIsInstalled();
        }

        return treeItems;
    }

    private async refreshNodeWhenAzureExtensionIsInstalled(): Promise<void> {
        let isExtensionInstalled: boolean = false;
        let timedout: boolean = false;
        const maxTimeout: number = 600000; //10 minutes
        setTimeout(() => { timedout = true; }, maxTimeout);

        while (!timedout && !isExtensionInstalled) {
            await delay(1000);
            isExtensionInstalled = extensions.getExtension('ms-vscode.azure-account') !== undefined;
        }

        if (isExtensionInstalled) {
            // Now the extension is installed, refresh the node.
            // tslint:disable-next-line: no-floating-promises
            this.refresh();
        }
    }
}
