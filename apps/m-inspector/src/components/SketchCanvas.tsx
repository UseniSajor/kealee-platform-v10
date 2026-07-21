import React, {useRef, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Dimensions} from 'react-native';
import {SkiaCanvas, Path, useTouchHandler, Skia} from '@shopify/react-native-skia';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {InspectionSketch} from '../types';

const {width, height} = Dimensions.get('window');
const CANVAS_WIDTH = width - 32;
const CANVAS_HEIGHT = height * 0.5;

interface SketchCanvasProps {
  onSave: (sketch: InspectionSketch) => void;
  onCancel?: () => void;
  initialSketch?: InspectionSketch;
}

export function SketchCanvas({onSave, onCancel, initialSketch}: SketchCanvasProps) {
  const [paths, setPaths] = useState<Array<{path: any; color: string; strokeWidth: number}>>(
    initialSketch ? JSON.parse(initialSketch.svgData) : [],
  );
  const [currentPath, setCurrentPath] = useState<any>(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);

  const touchHandler = useTouchHandler({
    onStart: (touchInfo) => {
      const path = Skia.Path.Make();
      path.moveTo(touchInfo.x, touchInfo.y);
      setCurrentPath({path, color: currentColor, strokeWidth});
    },
    onActive: (touchInfo) => {
      if (currentPath) {
        currentPath.path.lineTo(touchInfo.x, touchInfo.y);
        setCurrentPath({...currentPath});
      }
    },
    onEnd: () => {
      if (currentPath) {
        setPaths([...paths, currentPath]);
        setCurrentPath(null);
      }
    },
  });

  const handleClear = () => {
    setPaths([]);
    setCurrentPath(null);
  };

  const handleUndo = () => {
    setPaths(paths.slice(0, -1));
  };

  const handleSave = () => {
    const sketch: InspectionSketch = {
      id: `sketch-${Date.now()}`,
      name: `Sketch ${new Date().toLocaleString()}`,
      svgData: JSON.stringify(paths),
      timestamp: new Date().toISOString(),
      synced: false,
    };
    onSave(sketch);
  };

  const colors = ['#000000', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.colorPicker}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                {backgroundColor: color},
                currentColor === color && styles.colorOptionActive,
              ]}
              onPress={() => setCurrentColor(color)}
            />
          ))}
        </View>

        <View style={styles.toolButtons}>
          <TouchableOpacity style={styles.toolButton} onPress={handleUndo} disabled={paths.length === 0}>
            <Icon name="undo" size={24} color={paths.length === 0 ? '#94a3b8' : '#0ea5e9'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={handleClear}>
            <Icon name="clear" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.canvasContainer}>
        <SkiaCanvas style={styles.canvas} onTouch={touchHandler}>
          {paths.map((pathData, index) => (
            <Path
              key={index}
              path={pathData.path}
              color={pathData.color}
              style="stroke"
              strokeWidth={pathData.strokeWidth}
            />
          ))}
          {currentPath && (
            <Path
              path={currentPath.path}
              color={currentPath.color}
              style="stroke"
              strokeWidth={currentPath.strokeWidth}
            />
          )}
        </SkiaCanvas>
      </View>

      <View style={styles.controls}>
        <View style={styles.strokeWidthControl}>
          <Text style={styles.label}>Stroke Width:</Text>
          <View style={styles.strokeWidthButtons}>
            {[1, 3, 5, 8].map((width) => (
              <TouchableOpacity
                key={width}
                style={[
                  styles.strokeWidthButton,
                  strokeWidth === width && styles.strokeWidthButtonActive,
                ]}
                onPress={() => setStrokeWidth(width)}>
                <Text style={styles.strokeWidthText}>{width}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionButtons}>
          {onCancel && (
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.actionButtonText}>Save Sketch</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  colorOptionActive: {
    borderColor: '#0ea5e9',
    borderWidth: 3,
  },
  toolButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toolButton: {
    padding: 8,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  controls: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  strokeWidthControl: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  strokeWidthButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  strokeWidthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  strokeWidthButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  strokeWidthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#64748b',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
