import { Layout, LayoutIndex, BasicPane } from "./RenderLayout";


export function layoutIsEmpty(layout: Layout | undefined): boolean {
    if (!layout) return true;

    // Check immediate panes
    if (layout.panes.some(pane => pane.paneType != null)) {
        return false;
    }

    // Check nested panes
    for (const pane of layout.panes) {
        if (pane.content && !layoutIsEmpty(pane.content)) {
            return false;
        }
    }

    return true;
}

export function attachNode(layout: Layout, index: LayoutIndex, nodeId: string, fieldName: string): Layout {
    const newLayout = { ...layout, panes: layout?.panes ? [...layout.panes] : [] };

    if (typeof index === 'number') {
        newLayout.panes[index] = {
            nodeId,
            fieldName,
            paneType: 'NodePane'
        };
        return newLayout;
    } else {
        const [first, ...rest] = index.split('-').map(Number);
        if ("content" in newLayout.panes[first] && typeof newLayout.panes[first].content === "object") {
            newLayout.panes[first].content = attachNode(newLayout.panes[first].content as Layout,
                rest.length > 1 ? rest.join('-') : rest[0],
                nodeId,
                fieldName);
        }
        return newLayout;
    }
}


export function splitPane(layout: Layout, index: LayoutIndex, type: 'horizontal' | 'vertical', firstParentIndex?: LayoutIndex): Layout {
    const newLayout = { ...layout, panes: [...layout.panes] };

    if (firstParentIndex == null) {
        firstParentIndex = index;
    }

    if (typeof index === 'string' && index.includes('-')) {
        const [first, ...rest] = index.split('-').map(Number);
        if ("content" in newLayout.panes[first] && typeof newLayout.panes[first].content === "object") {
            newLayout.panes[first].content = splitPane(newLayout.panes[first].content as Layout,
                rest.length > 1 ? rest.join('-') : rest[0],
                type, firstParentIndex);
        }
        return newLayout;
    } else {
        const paneIndex = typeof index === 'string' ? Number(index) : index;

        const newPanes: BasicPane[] = [
            {
                ...layout.panes[paneIndex],
                paneType: 'NodePane'
            },
            {
                paneType: 'NodePane'
            }
        ];

        newLayout.panes[paneIndex] = {
            content: {
                type,
                panes: newPanes
            }
        };
        return newLayout;
    }
}

export function deletePane(layout: Layout, index: LayoutIndex): Layout {
    const newLayout = { ...layout, panes: [...layout.panes] };

    if (typeof index === 'string' && !index.includes('-')) {
        index = +index;
    }

    if (typeof index === 'number') {
        newLayout.panes.splice(index, 1);
        return newLayout;
    } else {
        const [first, ...rest] = index.split('-').map(Number);
        if ("content" in newLayout.panes[first] && typeof newLayout.panes[first].content === "object") {
            newLayout.panes[first].content = deletePane(newLayout.panes[first].content as Layout, rest.join('-'));
        }
        return newLayout;
    }
}

