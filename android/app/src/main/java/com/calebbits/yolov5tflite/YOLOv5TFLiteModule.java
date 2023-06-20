package com.calebbits.yolov5tflite;

import android.content.pm.PackageManager;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Promise;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;

import org.tensorflow.lite.examples.detection.customview.OverlayView;
import org.tensorflow.lite.examples.detection.env.ImageUtils;
import org.tensorflow.lite.examples.detection.env.Logger;
import org.tensorflow.lite.examples.detection.env.Utils;
import org.tensorflow.lite.examples.detection.tflite.Classifier;
import org.tensorflow.lite.examples.detection.tflite.YoloV5Classifier;
import org.tensorflow.lite.examples.detection.tflite.YoloV5ClassifierDetect;
import org.tensorflow.lite.examples.detection.tracking.MultiBoxTracker;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.LinkedList;
import java.util.List;
import java.util.Collections;
import com.google.gson.Gson; 

public class YOLOv5TFLiteModule extends ReactContextBaseJavaModule
{
    /**
     * Member Variables
     */
    private final ReactApplicationContext reactContext;
    private Classifier detector;
    Bitmap bitmapRaw;
    Bitmap cropBitmap;
    public static final int TF_OD_API_INPUT_SIZE = 640;
    private static final boolean TF_OD_API_IS_QUANTIZED = false;
    public static final float MINIMUM_CONFIDENCE_TF_OD_API = 0.3f;


    /**
     * Constructor
     *
     * @param reactContext ReactApplicationContext
     */
    public YOLOv5TFLiteModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "YOLOv5TFLite";
    }

    @ReactMethod
    public void detect(ReadableMap args,final Callback callback) throws IOException {
        final Paint paint = new Paint();
        String modelPath = args.getString("model");
        String imagePath = args.getString("image");
        String labelsPath = args.getString("labels");

        paint.setColor(Color.RED);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(2.0f);

        if(modelPath == null) {
            callback.invoke("NO_MODEL_PATH", "No model path specified");
            return;
        }
        if(modelPath.startsWith("file:///")) {
            modelPath = modelPath.substring(7);
        }

        if(imagePath == null) {
            callback.invoke("NO_IMAGE_PATH", "No image path specified");
            return;
        }
        

        // callback.invoke(imagePath);
        // InputStream inputStream = new FileInputStream(imagePath.replace("file://", ""));
        
        
        // callback.invoke(new Gson().toJson(bitmapRaw.getHeight()));
        // if(cropBitmap == null){
        //     callback.invoke("FILE_NOT_FOUND", "No file found");
        //     return;
        // }

        
        // if(modelPath != null && labelsPath != null){
            try {
                detector =
                        YoloV5Classifier.create(
                                reactContext.getAssets(),
                                modelPath,
                                labelsPath,
                                TF_OD_API_IS_QUANTIZED,  
                                TF_OD_API_INPUT_SIZE);
            } catch (final IOException e) {
                // e.printStackTrace();
                callback.invoke("CLASSIFIER_INIT_ERROR", "Classifier could not be initialized");
                return;
                // LOGGER.e(e, "Exception initializing classifier!");
                // Toast toast =
                //         Toast.makeText(
                //                 getApplicationContext(), "Classifier could not be initialized", Toast.LENGTH_SHORT);
                // toast.show();
                // finish();
            }
        // }
        // if(cropBitmap != null){
            InputStream inputStream = null;
            try{
                inputStream = new FileInputStream(imagePath.replace("file://", ""));
                bitmapRaw = BitmapFactory.decodeStream(inputStream);
                cropBitmap = Utils.processBitmap(bitmapRaw, TF_OD_API_INPUT_SIZE);
                // Canvas canvas = new Canvas(cropBitmap);
                if(cropBitmap != null){
                    List<Classifier.Recognition> results = detector.recognizeImage(cropBitmap);
                    List<String> resultList = Collections.<String>emptyList();
                    List<Classifier.Recognition> mappedRecognitions =
                        new LinkedList<Classifier.Recognition>();
                
                    for (final Classifier.Recognition result : results) {
                        final RectF location = result.getLocation();
                        if (location != null && result.getConfidence() >= MINIMUM_CONFIDENCE_TF_OD_API) {
                            resultList.add(result.getTitle());
                            // canvas.drawRect(location, paint);
            //                cropToFrameTransform.mapRect(location);
            //
            //                result.setLocation(location);
            //                mappedRecognitions.add(result);
                        }
                    }
                    callback.invoke(new Gson().toJson(resultList));
                    return;
                }else{
                    callback.invoke("BITMAP_ERROR", "bitmap failed to load");
                    return;
                }
                
            }catch(FileNotFoundException e){
                callback.invoke("FILE_NOT_FOUND", "No file found");
                return;
            }
            

        // }
        // callback.invoke("Cant Process","Cant Process");
        
    }



    
}